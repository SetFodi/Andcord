'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type OnlineStatus = 'online' | 'away' | 'offline';

interface PresenceState {
    [userId: string]: OnlineStatus;
}

export function usePresence() {
    const [presenceState, setPresenceState] = useState<PresenceState>({});
    const { profile } = useAuth();
    const supabase = createClient();

    useEffect(() => {
        if (!profile) return;

        let channel: RealtimeChannel;

        const setupPresence = async () => {
            channel = supabase.channel('online-users', {
                config: {
                    presence: {
                        key: profile.id,
                    },
                },
            });

            channel
                .on('presence', { event: 'sync' }, () => {
                    const state = channel.presenceState();
                    const newPresence: PresenceState = {};

                    Object.keys(state).forEach((key) => {
                        const presences = state[key] as { status?: OnlineStatus }[];
                        if (presences.length > 0) {
                            newPresence[key] = presences[0].status || 'online';
                        }
                    });

                    setPresenceState(newPresence);
                })
                .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                    const status = (newPresences[0] as { status?: OnlineStatus })?.status || 'online';
                    setPresenceState((prev) => ({ ...prev, [key]: status }));
                })
                .on('presence', { event: 'leave' }, ({ key }) => {
                    setPresenceState((prev) => {
                        const next = { ...prev };
                        delete next[key];
                        return next;
                    });
                })
                .subscribe(async (status) => {
                    if (status === 'SUBSCRIBED') {
                        await channel.track({ status: 'online' });
                    }
                });

            // Handle visibility change for away status
            const handleVisibilityChange = async () => {
                if (document.hidden) {
                    await channel.track({ status: 'away' });
                } else {
                    await channel.track({ status: 'online' });
                }
            };

            document.addEventListener('visibilitychange', handleVisibilityChange);

            return () => {
                document.removeEventListener('visibilitychange', handleVisibilityChange);
            };
        };

        setupPresence();

        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, [profile, supabase]);

    const getStatus = useCallback(
        (userId: string): OnlineStatus => {
            return presenceState[userId] || 'offline';
        },
        [presenceState]
    );

    const isOnline = useCallback(
        (userId: string): boolean => {
            return presenceState[userId] === 'online';
        },
        [presenceState]
    );

    return {
        presenceState,
        getStatus,
        isOnline,
    };
}
