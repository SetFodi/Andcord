'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { formatRelativeTime } from '@/lib/utils/formatDate';
import PostCard from '@/components/feed/PostCard';
import type { Profile, Post } from '@/types/database';
import './user-profile.css';

// Icons
const BackIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
);

const MessageIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);

const UserPlusIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <line x1="20" y1="8" x2="20" y2="14" />
        <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
);

const UserCheckIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <polyline points="17 11 19 13 23 9" />
    </svg>
);

const ClockIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

const CalendarIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

const GridIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
    </svg>
);

const ListIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
);

type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends';

export default function UserProfilePage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.id as string;

    const [userProfile, setUserProfile] = useState<Profile | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>('none');
    const [actionLoading, setActionLoading] = useState(false);
    const [mutualFriends, setMutualFriends] = useState<Profile[]>([]);
    const [stats, setStats] = useState({ posts: 0, friends: 0 });

    const { profile: currentUser } = useAuth();
    const supabase = createClient();

    const isOwnProfile = currentUser?.id === userId;

    // Fetch user profile
    const fetchUserProfile = useCallback(async () => {
        if (!userId) return;

        setLoading(true);

        // Fetch profile
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error || !profile) {
            console.error('Error fetching profile:', error);
            setLoading(false);
            return;
        }

        setUserProfile(profile);

        // Fetch user's posts
        const { data: userPosts } = await supabase
            .from('posts')
            .select(`
                *,
                author:profiles(*),
                likes:likes(count),
                comments:comments(*, author:profiles(*))
            `)
            .eq('author_id', userId)
            .order('created_at', { ascending: false })
            .limit(20);

        if (userPosts) {
            // Check likes for current user
            if (currentUser) {
                const postIds = userPosts.map((p: Post) => p.id);
                const { data: userLikes } = await supabase
                    .from('likes')
                    .select('post_id')
                    .eq('user_id', currentUser.id)
                    .in('post_id', postIds);

                const likedPostIds = new Set((userLikes || []).map((l: { post_id: string }) => l.post_id));

                const enrichedPosts = userPosts.map((post: Post) => ({
                    ...post,
                    likes_count: (post as unknown as { likes: Array<{ count: number }> }).likes?.[0]?.count || 0,
                    is_liked: likedPostIds.has(post.id),
                }));

                setPosts(enrichedPosts);
                setStats(prev => ({ ...prev, posts: enrichedPosts.length }));
            } else {
                setPosts(userPosts);
                setStats(prev => ({ ...prev, posts: userPosts.length }));
            }
        }

        // Fetch friend count
        const { count: friendCount } = await supabase
            .from('friendships')
            .select('*', { count: 'exact', head: true })
            .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
            .eq('status', 'accepted');

        setStats(prev => ({ ...prev, friends: friendCount || 0 }));

        // Check friendship status with current user
        if (currentUser && !isOwnProfile) {
            const { data: friendship } = await supabase
                .from('friendships')
                .select('*')
                .or(`and(requester_id.eq.${currentUser.id},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${currentUser.id})`)
                .single() as { data: { status: string; requester_id: string } | null };

            if (friendship) {
                if (friendship.status === 'accepted') {
                    setFriendshipStatus('friends');
                } else if (friendship.status === 'pending') {
                    if (friendship.requester_id === currentUser.id) {
                        setFriendshipStatus('pending_sent');
                    } else {
                        setFriendshipStatus('pending_received');
                    }
                }
            }

            // Fetch mutual friends
            const { data: myFriends } = await supabase
                .from('friendships')
                .select('requester_id, addressee_id')
                .or(`requester_id.eq.${currentUser.id},addressee_id.eq.${currentUser.id}`)
                .eq('status', 'accepted');

            const { data: theirFriends } = await supabase
                .from('friendships')
                .select('requester_id, addressee_id')
                .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
                .eq('status', 'accepted');

            if (myFriends && theirFriends) {
                const myFriendIds = new Set(
                    myFriends.flatMap((f: { requester_id: string; addressee_id: string }) =>
                        [f.requester_id, f.addressee_id].filter(id => id !== currentUser.id)
                    )
                );

                const theirFriendIds = new Set(
                    theirFriends.flatMap((f: { requester_id: string; addressee_id: string }) =>
                        [f.requester_id, f.addressee_id].filter(id => id !== userId)
                    )
                );

                const mutualIds = [...myFriendIds].filter(id => theirFriendIds.has(id));

                if (mutualIds.length > 0) {
                    const { data: mutualProfiles } = await supabase
                        .from('profiles')
                        .select('*')
                        .in('id', mutualIds.slice(0, 5));

                    setMutualFriends(mutualProfiles || []);
                }
            }
        }

        setLoading(false);
    }, [userId, currentUser, isOwnProfile, supabase]);

    useEffect(() => {
        fetchUserProfile();
    }, [fetchUserProfile]);

    // Handle friend request
    const handleFriendAction = async () => {
        if (!currentUser || isOwnProfile || actionLoading) return;

        setActionLoading(true);

        try {
            if (friendshipStatus === 'none') {
                // Send friend request
                await (supabase as unknown as { from: (table: string) => { insert: (data: object) => Promise<{ error: Error | null }> } })
                    .from('friendships')
                    .insert({
                        requester_id: currentUser.id,
                        addressee_id: userId,
                        status: 'pending',
                    });

                // Create notification
                await (supabase as unknown as { from: (table: string) => { insert: (data: object) => Promise<{ error: Error | null }> } })
                    .from('notifications')
                    .insert({
                        user_id: userId,
                        type: 'friend_request',
                        data: {
                            requester_id: currentUser.id,
                            requester_name: currentUser.display_name,
                        },
                    });

                setFriendshipStatus('pending_sent');
            } else if (friendshipStatus === 'pending_received') {
                // Accept friend request
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (supabase as any)
                    .from('friendships')
                    .update({ status: 'accepted' })
                    .eq('requester_id', userId)
                    .eq('addressee_id', currentUser.id);

                // Create notification
                await (supabase as unknown as { from: (table: string) => { insert: (data: object) => Promise<{ error: Error | null }> } })
                    .from('notifications')
                    .insert({
                        user_id: userId,
                        type: 'friend_accepted',
                        data: {
                            accepter_id: currentUser.id,
                            accepter_name: currentUser.display_name,
                        },
                    });

                setFriendshipStatus('friends');
            }
        } catch (error) {
            console.error('Error with friend action:', error);
        } finally {
            setActionLoading(false);
        }
    };

    // Start a DM with this user
    const handleMessage = async () => {
        if (!currentUser || isOwnProfile) return;

        // Check if conversation already exists
        const { data: existingConv } = await supabase
            .from('conversations')
            .select('id')
            .contains('participant_ids', [currentUser.id, userId])
            .single() as { data: { id: string } | null };

        if (existingConv) {
            router.push(`/messages/${existingConv.id}`);
            return;
        }

        // Create new conversation
        const { data: newConv, error } = await (supabase as unknown as { from: (table: string) => { insert: (data: object) => { select: (columns: string) => { single: () => Promise<{ data: { id: string } | null; error: Error | null }> } } } })
            .from('conversations')
            .insert({
                participant_ids: [currentUser.id, userId],
                last_message_at: new Date().toISOString(),
            })
            .select('id')
            .single();

        if (error) {
            console.error('Error creating conversation:', error);
            return;
        }

        if (newConv) {
            router.push(`/messages/${newConv.id}`);
        }
    };

    const handlePostUpdate = () => {
        fetchUserProfile();
    };

    if (loading) {
        return (
            <>
                <header className="page-header">
                    <button className="btn btn-ghost btn-icon back-btn" onClick={() => router.back()}>
                        <BackIcon />
                    </button>
                    <h1 className="page-title">Profile</h1>
                </header>
                <div className="page-content">
                    <div className="user-profile-skeleton">
                        <div className="skeleton skeleton-cover" />
                        <div className="skeleton-profile-section">
                            <div className="skeleton skeleton-avatar-large" />
                            <div className="skeleton skeleton-name" />
                            <div className="skeleton skeleton-bio" />
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (!userProfile) {
        return (
            <>
                <header className="page-header">
                    <button className="btn btn-ghost btn-icon back-btn" onClick={() => router.back()}>
                        <BackIcon />
                    </button>
                    <h1 className="page-title">Profile</h1>
                </header>
                <div className="page-content">
                    <div className="empty-state">
                        <div className="empty-state-icon">👤</div>
                        <h3 className="empty-state-title">User not found</h3>
                        <p className="empty-state-description">
                            This user doesn&apos;t exist or their profile is private.
                        </p>
                        <button className="btn btn-primary" onClick={() => router.back()}>
                            Go Back
                        </button>
                    </div>
                </div>
            </>
        );
    }

    const getFriendButtonContent = () => {
        switch (friendshipStatus) {
            case 'friends':
                return (
                    <>
                        <UserCheckIcon />
                        <span>Friends</span>
                    </>
                );
            case 'pending_sent':
                return (
                    <>
                        <ClockIcon />
                        <span>Pending</span>
                    </>
                );
            case 'pending_received':
                return (
                    <>
                        <UserPlusIcon />
                        <span>Accept</span>
                    </>
                );
            default:
                return (
                    <>
                        <UserPlusIcon />
                        <span>Add Friend</span>
                    </>
                );
        }
    };

    return (
        <>
            <header className="profile-page-header">
                <button className="btn btn-ghost btn-icon back-btn" onClick={() => router.back()}>
                    <BackIcon />
                </button>
                <div className="header-info">
                    <h1 className="page-title">{userProfile.display_name}</h1>
                    <span className="post-count">{stats.posts} posts</span>
                </div>
            </header>

            <div className="user-profile-page">
                {/* Cover & Avatar Section */}
                <div className="profile-hero">
                    <div className="profile-cover">
                        <div className="cover-gradient" />
                    </div>

                    <div className="profile-avatar-section">
                        <div className="avatar avatar-4xl profile-avatar">
                            {userProfile.avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={userProfile.avatar_url} alt={userProfile.display_name || 'Avatar'} />
                            ) : (
                                <span>{userProfile.display_name?.[0]?.toUpperCase() || '?'}</span>
                            )}
                        </div>

                        {!isOwnProfile && currentUser && (
                            <div className="profile-actions">
                                <button
                                    className={`btn ${friendshipStatus === 'friends' ? 'btn-secondary' : friendshipStatus === 'pending_received' ? 'btn-primary' : 'btn-outline'}`}
                                    onClick={handleFriendAction}
                                    disabled={actionLoading || friendshipStatus === 'friends' || friendshipStatus === 'pending_sent'}
                                >
                                    {actionLoading ? '...' : getFriendButtonContent()}
                                </button>
                                <button className="btn btn-primary" onClick={handleMessage}>
                                    <MessageIcon />
                                    <span>Message</span>
                                </button>
                            </div>
                        )}

                        {isOwnProfile && (
                            <Link href="/profile" className="btn btn-secondary">
                                Edit Profile
                            </Link>
                        )}
                    </div>
                </div>

                {/* Profile Info */}
                <div className="profile-info-section">
                    <div className="profile-names">
                        <h2 className="display-name">{userProfile.display_name}</h2>
                        <span className="username">@{userProfile.username}</span>
                    </div>

                    {userProfile.bio && (
                        <p className="profile-bio">{userProfile.bio}</p>
                    )}

                    <div className="profile-meta">
                        <span className="meta-item">
                            <CalendarIcon />
                            Joined {formatRelativeTime(userProfile.created_at)}
                        </span>
                    </div>

                    <div className="profile-stats">
                        <div className="stat-item">
                            <span className="stat-value">{stats.posts}</span>
                            <span className="stat-label">Posts</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{stats.friends}</span>
                            <span className="stat-label">Friends</span>
                        </div>
                    </div>

                    {/* Mutual Friends */}
                    {mutualFriends.length > 0 && (
                        <div className="mutual-friends">
                            <div className="mutual-avatars">
                                {mutualFriends.slice(0, 3).map((friend) => (
                                    <Link key={friend.id} href={`/user/${friend.id}`} className="avatar avatar-sm">
                                        {friend.avatar_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={friend.avatar_url} alt="" />
                                        ) : (
                                            <span>{friend.display_name?.[0]?.toUpperCase() || '?'}</span>
                                        )}
                                    </Link>
                                ))}
                            </div>
                            <span className="mutual-text">
                                {mutualFriends.length} mutual friend{mutualFriends.length > 1 ? 's' : ''}
                            </span>
                        </div>
                    )}
                </div>

                {/* Posts Section */}
                <div className="profile-posts-section">
                    <div className="posts-header">
                        <h3>Posts</h3>
                        <div className="view-toggle">
                            <button className="btn btn-ghost btn-icon active">
                                <ListIcon />
                            </button>
                            <button className="btn btn-ghost btn-icon">
                                <GridIcon />
                            </button>
                        </div>
                    </div>

                    <div className="posts-feed">
                        {posts.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">📝</div>
                                <h3 className="empty-state-title">No posts yet</h3>
                                <p className="empty-state-description">
                                    {isOwnProfile
                                        ? "You haven't posted anything yet. Share your first post!"
                                        : `${userProfile.display_name} hasn't posted anything yet.`}
                                </p>
                            </div>
                        ) : (
                            posts.map((post, index) => (
                                <div
                                    key={post.id}
                                    className="post-wrapper"
                                    style={{ animationDelay: `${Math.min(index * 50, 250)}ms` }}
                                >
                                    <PostCard post={post} onUpdate={handlePostUpdate} />
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
