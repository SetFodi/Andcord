'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import type { Friendship, Profile } from '@/types/database';
import './friends.css';

type FriendshipWithProfiles = Friendship & {
    requester: Profile;
    addressee: Profile;
};

export default function FriendsPage() {
    const [friends, setFriends] = useState<Profile[]>([]);
    const [pendingRequests, setPendingRequests] = useState<FriendshipWithProfiles[]>([]);
    const [sentRequests, setSentRequests] = useState<FriendshipWithProfiles[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Profile[]>([]);
    const [searching, setSearching] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'friends' | 'pending' | 'search'>('friends');

    const { profile } = useAuth();
    const supabase = createClient();

    // Fetch friendships
    useEffect(() => {
        const fetchFriendships = async () => {
            if (!profile) return;

            // Fetch accepted friendships
            const { data: friendships } = await supabase
                .from('friendships')
                .select('*, requester:profiles!requester_id(*), addressee:profiles!addressee_id(*)')
                .or(`requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`)
                .eq('status', 'accepted');

            if (friendships) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const friendProfiles = (friendships as any[]).map((f) =>
                    f.requester_id === profile.id ? f.addressee : f.requester
                );
                setFriends(friendProfiles);
            }

            // Fetch pending requests (where user is addressee)
            const { data: pending } = await supabase
                .from('friendships')
                .select('*, requester:profiles!requester_id(*), addressee:profiles!addressee_id(*)')
                .eq('addressee_id', profile.id)
                .eq('status', 'pending');

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setPendingRequests((pending as any[]) || []);

            // Fetch sent requests
            const { data: sent } = await supabase
                .from('friendships')
                .select('*, requester:profiles!requester_id(*), addressee:profiles!addressee_id(*)')
                .eq('requester_id', profile.id)
                .eq('status', 'pending');

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setSentRequests((sent as any[]) || []);
            setLoading(false);
        };

        fetchFriendships();

        // Timeout fallback
        const timeout = setTimeout(() => {
            setLoading(false);
        }, 6000);

        return () => clearTimeout(timeout);
    }, [profile, supabase]);

    // Search users
    useEffect(() => {
        const search = async () => {
            if (!searchQuery.trim() || !profile) {
                setSearchResults([]);
                return;
            }

            setSearching(true);
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
                .neq('id', profile.id)
                .limit(10);

            setSearchResults(data || []);
            setSearching(false);
        };

        const debounce = setTimeout(search, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery, profile, supabase]);

    const handleAcceptRequest = async (friendshipId: string) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
            .from('friendships')
            .update({ status: 'accepted' })
            .eq('id', friendshipId);

        if (!error) {
            const request = pendingRequests.find((r) => r.id === friendshipId);
            if (request) {
                setFriends([...friends, request.requester]);
                setPendingRequests(pendingRequests.filter((r) => r.id !== friendshipId));

                // Notify the requester
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (supabase as any).from('notifications').insert({
                    user_id: request.requester_id,
                    type: 'friend_accepted',
                    data: {
                        user_id: profile?.id,
                        user_name: profile?.display_name,
                    },
                });
            }
        }
    };

    const handleDeclineRequest = async (friendshipId: string) => {
        await supabase.from('friendships').delete().eq('id', friendshipId);
        setPendingRequests(pendingRequests.filter((r) => r.id !== friendshipId));
    };

    const handleSendRequest = async (userId: string) => {
        if (!profile) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
            .from('friendships')
            .insert({
                requester_id: profile.id,
                addressee_id: userId,
                status: 'pending',
            })
            .select('*, requester:profiles!requester_id(*), addressee:profiles!addressee_id(*)')
            .single();

        if (!error && data) {
            setSentRequests([...sentRequests, data]);

            // Notify the user
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any).from('notifications').insert({
                user_id: userId,
                type: 'friend_request',
                data: {
                    user_id: profile.id,
                    user_name: profile.display_name,
                },
            });
        }
    };

    const handleCancelRequest = async (friendshipId: string) => {
        await supabase.from('friendships').delete().eq('id', friendshipId);
        setSentRequests(sentRequests.filter((r) => r.id !== friendshipId));
    };

    const handleRemoveFriend = async (friendId: string) => {
        if (!profile) return;

        await supabase
            .from('friendships')
            .delete()
            .or(`requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`)
            .or(`requester_id.eq.${friendId},addressee_id.eq.${friendId}`);

        setFriends(friends.filter((f) => f.id !== friendId));
    };

    const handleStartConversation = async (friendId: string) => {
        if (!profile) return;

        // Check if conversation exists
        const { data: existing } = await supabase
            .from('conversations')
            .select('id')
            .contains('participant_ids', [profile.id, friendId])
            .single();

        if (existing) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            window.location.href = `/messages/${(existing as any).id}`;
            return;
        }

        // Create new conversation
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: newConv } = await (supabase as any)
            .from('conversations')
            .insert({
                participant_ids: [profile.id, friendId],
            })
            .select('id')
            .single();

        if (newConv) {
            window.location.href = `/messages/${newConv.id}`;
        }
    };

    const isFriend = (userId: string) => friends.some((f) => f.id === userId);
    const hasPendingRequest = (userId: string) =>
        sentRequests.some((r) => r.addressee_id === userId) ||
        pendingRequests.some((r) => r.requester_id === userId);

    return (
        <>
            <header className="page-header">
                <h1 className="page-title">Friends</h1>
                {pendingRequests.length > 0 && (
                    <span className="badge">{pendingRequests.length}</span>
                )}
            </header>

            <div className="page-content-wide">
                {/* Tabs */}
                <div className="tabs-container">
                    <div className="tabs">
                        <button
                            className={`tab ${activeTab === 'friends' ? 'active' : ''}`}
                            onClick={() => setActiveTab('friends')}
                        >
                            Friends ({friends.length})
                        </button>
                        <button
                            className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
                            onClick={() => setActiveTab('pending')}
                        >
                            Requests {pendingRequests.length > 0 && `(${pendingRequests.length})`}
                        </button>
                        <button
                            className={`tab ${activeTab === 'search' ? 'active' : ''}`}
                            onClick={() => setActiveTab('search')}
                        >
                            Add Friends
                        </button>
                    </div>
                </div>

                {/* Friends List */}
                {activeTab === 'friends' && (
                    <div className="friends-grid animate-fadeIn">
                        {loading ? (
                            <>
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="friend-card skeleton-card">
                                        <div className="skeleton skeleton-avatar-lg" />
                                        <div className="skeleton skeleton-name" />
                                        <div className="skeleton skeleton-handle" />
                                    </div>
                                ))}
                            </>
                        ) : friends.length === 0 ? (
                            <div className="empty-state full-width">
                                <div className="empty-state-icon">🤝</div>
                                <h3 className="empty-state-title">No friends yet</h3>
                                <p className="empty-state-description">
                                    Search for people to add as friends!
                                </p>
                                <button className="btn btn-primary" onClick={() => setActiveTab('search')}>
                                    Find Friends
                                </button>
                            </div>
                        ) : (
                            friends.map((friend) => (
                                <div key={friend.id} className="friend-card">
                                    <Link href={`/profile/${friend.id}`} className="friend-avatar">
                                        <div className="avatar avatar-xl">
                                            {friend.avatar_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={friend.avatar_url} alt="" />
                                            ) : (
                                                <span>{friend.display_name?.[0]?.toUpperCase() || '?'}</span>
                                            )}
                                        </div>
                                    </Link>
                                    <Link href={`/profile/${friend.id}`} className="friend-name">
                                        {friend.display_name}
                                    </Link>
                                    <span className="friend-handle">@{friend.username}</span>
                                    <div className="friend-actions">
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => handleStartConversation(friend.id)}
                                        >
                                            Message
                                        </button>
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => handleRemoveFriend(friend.id)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Pending Requests */}
                {activeTab === 'pending' && (
                    <div className="requests-section animate-fadeIn">
                        {pendingRequests.length > 0 && (
                            <>
                                <h3 className="section-title">Pending Requests</h3>
                                <div className="requests-list">
                                    {pendingRequests.map((request) => (
                                        <div key={request.id} className="request-item">
                                            <Link href={`/profile/${request.requester.id}`} className="avatar avatar-lg">
                                                {request.requester.avatar_url ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={request.requester.avatar_url} alt="" />
                                                ) : (
                                                    <span>{request.requester.display_name?.[0]?.toUpperCase() || '?'}</span>
                                                )}
                                            </Link>
                                            <div className="request-info">
                                                <Link href={`/profile/${request.requester.id}`} className="request-name">
                                                    {request.requester.display_name}
                                                </Link>
                                                <span className="request-handle">@{request.requester.username}</span>
                                            </div>
                                            <div className="request-actions">
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => handleAcceptRequest(request.id)}
                                                >
                                                    Accept
                                                </button>
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => handleDeclineRequest(request.id)}
                                                >
                                                    Decline
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {sentRequests.length > 0 && (
                            <>
                                <h3 className="section-title">Sent Requests</h3>
                                <div className="requests-list">
                                    {sentRequests.map((request) => (
                                        <div key={request.id} className="request-item">
                                            <Link href={`/profile/${request.addressee.id}`} className="avatar avatar-lg">
                                                {request.addressee.avatar_url ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={request.addressee.avatar_url} alt="" />
                                                ) : (
                                                    <span>{request.addressee.display_name?.[0]?.toUpperCase() || '?'}</span>
                                                )}
                                            </Link>
                                            <div className="request-info">
                                                <Link href={`/profile/${request.addressee.id}`} className="request-name">
                                                    {request.addressee.display_name}
                                                </Link>
                                                <span className="request-handle">@{request.addressee.username}</span>
                                            </div>
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => handleCancelRequest(request.id)}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {pendingRequests.length === 0 && sentRequests.length === 0 && (
                            <div className="empty-state">
                                <div className="empty-state-icon">📬</div>
                                <h3 className="empty-state-title">No pending requests</h3>
                                <p className="empty-state-description">
                                    Friend requests you receive or send will appear here
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Search */}
                {activeTab === 'search' && (
                    <div className="search-section animate-fadeIn">
                        <div className="search-input-wrapper">
                            <input
                                type="text"
                                className="input search-input"
                                placeholder="Search by username or name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searching && <span className="search-spinner">⏳</span>}
                        </div>

                        {searchResults.length > 0 ? (
                            <div className="search-results">
                                {searchResults.map((user) => (
                                    <div key={user.id} className="search-result-item">
                                        <Link href={`/profile/${user.id}`} className="avatar avatar-lg">
                                            {user.avatar_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={user.avatar_url} alt="" />
                                            ) : (
                                                <span>{user.display_name?.[0]?.toUpperCase() || '?'}</span>
                                            )}
                                        </Link>
                                        <div className="result-info">
                                            <Link href={`/profile/${user.id}`} className="result-name">
                                                {user.display_name}
                                            </Link>
                                            <span className="result-handle">@{user.username}</span>
                                        </div>
                                        {isFriend(user.id) ? (
                                            <span className="friend-badge">Friend</span>
                                        ) : hasPendingRequest(user.id) ? (
                                            <span className="pending-badge">Pending</span>
                                        ) : (
                                            <button
                                                className="btn btn-primary btn-sm"
                                                onClick={() => handleSendRequest(user.id)}
                                            >
                                                Add Friend
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : searchQuery && !searching ? (
                            <div className="empty-state">
                                <p className="empty-state-description">No users found</p>
                            </div>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-state-icon">🔍</div>
                                <h3 className="empty-state-title">Find friends</h3>
                                <p className="empty-state-description">
                                    Search for people by their username or display name
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
