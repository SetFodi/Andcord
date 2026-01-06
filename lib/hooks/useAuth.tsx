'use client';

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
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
    deleteAccount: () => Promise<{ error: Error | null }>;
    compactMode: boolean;
    setCompactMode: (enabled: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PROFILE_CACHE_KEY = 'andcord-profile-cache';
const SESSION_CACHE_KEY = 'andcord-session-cache';
const COMPACT_MODE_KEY = 'andcord-compact-mode';

// Get cached profile from localStorage (runs synchronously on mount)
const getCachedProfile = (): Profile | null => {
    if (typeof window === 'undefined') return null;
    try {
        const cached = localStorage.getItem(PROFILE_CACHE_KEY);
        if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && parsed.id && parsed.username) {
                return parsed as Profile;
            }
        }
    } catch {
        // Silent fail
    }
    return null;
};

// Save profile to localStorage
const setCachedProfile = (profile: Profile | null) => {
    if (typeof window === 'undefined') return;
    try {
        if (profile) {
            localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
        } else {
            localStorage.removeItem(PROFILE_CACHE_KEY);
        }
    } catch {
        // Silent fail
    }
};

// Cache session state (user ID) for instant loading decision
const getCachedSessionUserId = (): string | null => {
    if (typeof window === 'undefined') return null;
    try {
        return localStorage.getItem(SESSION_CACHE_KEY);
    } catch {
        return null;
    }
};

const setCachedSessionUserId = (userId: string | null) => {
    if (typeof window === 'undefined') return;
    try {
        if (userId) {
            localStorage.setItem(SESSION_CACHE_KEY, userId);
        } else {
            localStorage.removeItem(SESSION_CACHE_KEY);
        }
    } catch {
        // Silent fail
    }
};

// Check if we have valid cached auth state (profile matches cached session)
const hasValidCache = (): boolean => {
    const cachedProfile = getCachedProfile();
    const cachedUserId = getCachedSessionUserId();
    return !!(cachedProfile && cachedUserId && cachedProfile.id === cachedUserId);
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    // Initialize profile from cache for instant load
    const [profile, setProfile] = useState<Profile | null>(() => getCachedProfile());
    const [session, setSession] = useState<Session | null>(null);
    const [compactMode, setCompactModeState] = useState(false);
    // Start with loading=true for server/client consistency (prevents hydration error)
    const [loading, setLoading] = useState(true);

    const supabase = createClient();
    const router = useRouter();

    // Fetch user profile
    const fetchProfile = async (userId: string) => {
        try {
            const fetchPromise = supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Profile fetch timeout')), 4000)
            );

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

            if (error) {
                // If profile not found, try to create one
                if (error.code === 'PGRST116') {
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

                    if (insertError) return null;

                    setCachedProfile(newProfile);
                    return newProfile;
                }
                return null;
            }

            setCachedProfile(data);
            return data;
        } catch {
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

    // Track user ID in ref to avoid stale closure in event listener
    const userIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (user?.id) userIdRef.current = user.id;
        else userIdRef.current = null;
    }, [user]);

    useEffect(() => {
        let mounting = true;

        // Immediately check cache on client mount to skip loading state if possible
        if (hasValidCache()) {
            setLoading(false);
        }

        // Safety timeout - reduced to 3s since we have cache fallback
        const safetyTimeout = setTimeout(() => {
            if (mounting && loading) {
                setLoading(false);
            }
        }, 3000);

        const syncProfile = async (currentSession: Session | null) => {
            if (!currentSession?.user) {
                if (mounting) setProfile(null);
                return;
            }

            try {
                const profileData = await fetchProfile(currentSession.user.id);
                if (mounting && profileData) {
                    setProfile(profileData);
                }
            } catch {
                // Keep existing profile on error
            }
        };

        const initAuth = async () => {
            try {
                const { data: { session: initialSession } } = await supabase.auth.getSession();

                if (initialSession && mounting) {
                    setSession(initialSession);
                    setUser(initialSession.user);
                    userIdRef.current = initialSession.user.id;

                    // Cache session user ID for future instant loads
                    setCachedSessionUserId(initialSession.user.id);

                    // Validate cached profile belongs to current user
                    const cachedProfile = getCachedProfile();
                    if (cachedProfile && cachedProfile.id !== initialSession.user.id) {
                        setCachedProfile(null);
                        setCachedSessionUserId(null);
                        setProfile(null);
                    }

                    // Unblock UI immediately
                    if (mounting) setLoading(false);

                    // Sync fresh profile in background
                    syncProfile(initialSession);
                } else if (mounting) {
                    // No session - clear cache
                    setCachedProfile(null);
                    setCachedSessionUserId(null);
                    setProfile(null);
                    setLoading(false);
                }
            } catch {
                if (mounting) setLoading(false);
            }
        };

        initAuth();

        // Realtime auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, currentSession) => {
                if (!mounting) return;

                setSession(currentSession);
                setUser(currentSession?.user ?? null);

                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
                    const isSameUser = userIdRef.current === currentSession?.user?.id;

                    if (currentSession?.user) {
                        setCachedSessionUserId(currentSession.user.id);
                    }

                    // Only show loading if switching users
                    if (!isSameUser) {
                        setLoading(true);
                        await syncProfile(currentSession);
                        if (mounting) setLoading(false);
                    } else {
                        // Same user - sync in background, no loading
                        syncProfile(currentSession);
                    }
                } else if (event === 'SIGNED_OUT') {
                    setProfile(null);
                    setCachedProfile(null);
                    setCachedSessionUserId(null);
                    setLoading(false);
                    userIdRef.current = null;
                } else {
                    setLoading(false);
                }
            }
        );

        return () => {
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
            await supabase.auth.signOut();
            setUser(null);
            setProfile(null);
            setSession(null);
            setCachedProfile(null);
            setCachedSessionUserId(null);
            router.push('/login');
        } catch {
            // Silent fail on logout
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

    // Compact Mode logic
    useEffect(() => {
        const saved = localStorage.getItem(COMPACT_MODE_KEY);
        if (saved === 'true') {
            setCompactModeState(true);
            document.documentElement.setAttribute('data-compact', 'true');
        }
    }, []);

    const setCompactMode = (enabled: boolean) => {
        setCompactModeState(enabled);
        localStorage.setItem(COMPACT_MODE_KEY, enabled.toString());
        if (enabled) {
            document.documentElement.setAttribute('data-compact', 'true');
        } else {
            document.documentElement.removeAttribute('data-compact');
        }
    };

    // Delete account
    const deleteAccount = async () => {
        try {
            if (!user) throw new Error('No user logged in');

            // 1. Delete user from auth.users via RPC
            // This function needs to be created in Supabase
            const { error: rpcError } = await supabase.rpc('delete_user_data');

            if (rpcError) {
                console.error('RPC Error:', rpcError);
                // Fallback: If RPC fails or isn't there, we might just try to sign out 
                // but for a real "delete account" we want the RPC to work.
                throw rpcError;
            }

            // 2. Sign out
            await signOut();

            return { error: null };
        } catch (error) {
            console.error('Delete account error:', error);
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
                deleteAccount,
                compactMode,
                setCompactMode,
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
