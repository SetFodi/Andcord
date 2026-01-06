'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/database';

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    session: Session | null;
    loading: boolean;
    signUp: (email: string, password: string, username: string) => Promise<{ error: Error | null }>;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
    updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    const supabase = createClient();
    const router = useRouter();

    // Fetch user profile
    const fetchProfile = async (userId: string) => {
        console.log(`🔍 fetching profile for ${userId}`);

        try {
            // Create a promise that rejects after 8 seconds to prevent hanging
            // Increased to 8s to prevent false positives on slower networks
            const fetchPromise = supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Profile fetch timeout')), 8000)
            );

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

            if (error) {
                console.error('❌ fetchProfile error:', error);
                // If profile not found, it might be a user created before the trigger
                // Try to create the profile
                if (error.code === 'PGRST116') {
                    console.log('⚠️ Profile not found, attempting to create one...');

                    // Get user metadata for username
                    const { data: userData } = await supabase.auth.getUser();
                    const username = userData?.user?.user_metadata?.username
                        || 'user_' + userId.slice(0, 8);

                    const { data: newProfile, error: insertError } = await (supabase as any)
                        .from('profiles')
                        .insert({
                            id: userId,
                            username,
                            display_name: username,
                        })
                        .select()
                        .single();

                    if (insertError) {
                        console.error('❌ Error creating profile:', insertError);
                        return null;
                    }

                    console.log('✅ Created new profile:', newProfile);
                    return newProfile;
                }
                return null;
            }

            console.log('✅ Profile found:', data.username);
            return data;
        } catch (err: any) {
            if (err.message === 'Profile fetch timeout') {
                console.warn('⚠️ Profile fetch timed out, skipping profile sync for now to allow app to load.');
                return null;
            }
            console.error('💥 fetchProfile exception:', err);
            return null;
        }
    };

    // Refresh profile data
    const refreshProfile = async () => {
        if (user) {
            const profileData = await fetchProfile(user.id);
            if (profileData) setProfile(profileData);
        }
    };

    useEffect(() => {
        let mounting = true;
        console.log('🏁 AuthProvider mounted');

        // Safety timeout to ensure we don't spin forever
        const safetyTimeout = setTimeout(() => {
            if (mounting && loading) {
                console.warn('🕒 Auth safety timeout reached. Forcing loading to false.');
                setLoading(false);
            }
        }, 6000);

        const syncProfile = async (currentSession: Session | null) => {
            if (!currentSession?.user) {
                if (mounting) {
                    setProfile(null);
                    console.log('👤 No user, profile cleared');
                }
                return;
            }

            try {
                const profileData = await fetchProfile(currentSession.user.id);
                if (mounting) {
                    setProfile(profileData);
                }
            } catch (err) {
                console.error('❌ Profile sync error:', err);
            }
        };

        // 1. Initial Session Check (Standard Pattern)
        const initAuth = async () => {
            try {
                console.log('🚀 Checking initial session (getSession)...');
                const { data: { session: initialSession }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('❌ getSession error:', error);
                }

                if (initialSession && mounting) {
                    console.log('🔑 Initial session found for:', initialSession.user.email);
                    setSession(initialSession);
                    setUser(initialSession.user);
                    await syncProfile(initialSession);
                } else {
                    console.log('🤷 No initial session found via getSession');
                }
            } catch (e) {
                console.error('💥 Init auth exception:', e);
            } finally {
                if (mounting) {
                    console.log('⏳ Init done, setting loading=false (unless listener overrides)');
                    // We rely on getSession for the definitive "loading done" signal initially.
                    // If onAuthStateChange triggers a reload immediately after, it can set loading=true again.
                    setLoading(false);
                }
            }
        };

        initAuth();

        // 2. Realtime Listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, currentSession) => {
                console.log(`📣 Auth State Change: ${event}`, currentSession?.user?.email);

                if (!mounting) return;

                // Update basic state
                setSession(currentSession);
                setUser(currentSession?.user ?? null);

                // Handle Profile Sync based on event
                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
                    // Only show loading state if we're switching users or don't have a session yet
                    const isSameUser = user?.id === currentSession?.user?.id;

                    if (!isSameUser) {
                        setLoading(true);
                    }

                    // Sync profile in background if same user, or foreground if new
                    await syncProfile(currentSession);

                    if (mounting && !isSameUser) {
                        setLoading(false);
                    }
                } else if (event === 'SIGNED_OUT') {
                    setProfile(null);
                    setLoading(false);
                } else {
                    // Other events
                    setLoading(false);
                }
            }
        );

        return () => {
            console.log('🔌 AuthProvider unmounting');
            mounting = false;
            clearTimeout(safetyTimeout);
            subscription.unsubscribe();
        };
    }, []);

    // Sign up
    const signUp = async (email: string, password: string, username: string) => {
        try {
            const { error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { username },
                },
            });
            if (authError) throw authError;
            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    // Sign in
    const signIn = async (email: string, password: string) => {
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    // Sign out
    const signOut = async () => {
        try {
            console.log('👋 Signing out...');
            await supabase.auth.signOut();
            setUser(null);
            setProfile(null);
            setSession(null);
            router.push('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // Update profile
    const updateProfile = async (updates: Partial<Profile>) => {
        try {
            if (!user) throw new Error('No user logged in');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase as any)
                .from('profiles')
                .update(updates)
                .eq('id', user.id);

            if (error) throw error;
            await refreshProfile();
            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                session,
                loading,
                signUp,
                signIn,
                signOut,
                updateProfile,
                refreshProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
