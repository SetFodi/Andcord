'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
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

    // Fetch user profile
    const fetchProfile = async (userId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            // If profile not found, it might be a user created before the trigger
            // Try to create the profile
            if (error.code === 'PGRST116') {
                console.log('Profile not found, attempting to create one...');

                // Get user metadata for username
                const { data: userData } = await supabase.auth.getUser();
                const username = userData?.user?.user_metadata?.username
                    || 'user_' + userId.slice(0, 8);

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                    console.error('Error creating profile:', insertError);
                    return null;
                }

                return newProfile;
            }

            console.error('Error fetching profile:', error);
            return null;
        }

        return data;
    };

    // Refresh profile data
    const refreshProfile = async () => {
        if (user) {
            const profileData = await fetchProfile(user.id);
            setProfile(profileData);
        }
    };

    useEffect(() => {
        // Get initial session
        const initAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                const profileData = await fetchProfile(session.user.id);
                setProfile(profileData);
            }

            setLoading(false);
        };

        // Add timeout to prevent infinite loading
        const timeout = setTimeout(() => {
            if (loading) {
                console.warn('Auth loading timeout - forcing loading to false');
                setLoading(false);
            }
        }, 5000); // 5 second timeout

        initAuth().catch((err) => {
            console.error('Auth init error:', err);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('Auth state changed:', event);
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    try {
                        const profileData = await fetchProfile(session.user.id);
                        setProfile(profileData);
                    } catch (err) {
                        console.error('Error in auth state change profile fetch:', err);
                    }
                } else {
                    setProfile(null);
                }

                setLoading(false);
            }
        );

        return () => {
            clearTimeout(timeout);
            subscription.unsubscribe();
        };
    }, []);

    // Sign up with email and password
    const signUp = async (email: string, password: string, username: string) => {
        try {
            // Sign up the user with username in metadata
            // The database trigger will automatically create the profile
            const { error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username: username,
                    },
                },
            });

            if (authError) throw authError;

            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    // Sign in with email and password
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
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setSession(null);
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

            // Refresh profile data
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
