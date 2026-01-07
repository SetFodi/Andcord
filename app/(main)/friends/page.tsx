'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import type { Friendship, Profile } from '@/types/database';
import FriendSearchModal from '@/components/friends/FriendSearchModal';
import './friends.css';

// Icons
const MailIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
);

const HandshakeIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m11 17 2 2a1 1 0 1 0 3-3" />
        <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-1.42-1.42l4.88-4.88a3 3 0 0 0 0-4.24l2.12-2.12a2 2 0 0 1 2.83 0l7.25 7.25a2 2 0 0 1 0 2.83l-3.75 3.75a2 2 0 0 1-2.83 0" />
        <path d="m5.9 18.37 2.83 2.83a2 2 0 0 0 2.83 0l6.5-6.5" />
        <path d="M12 9a2 2 0 0 0-3-3l-2.12 2.12a2 2 0 0 0 0 2.83 1 1 0 0 0-1.41-1.41 1 1 0 0 0 0 1.41l-2.12 2.12a2 2 0 0 0 0 2.83l3.75 3.75a2 2 0 0 0 2.83 0" />
    </svg>
);

type FriendshipWithProfiles = Friendship & {
    requester: Profile;
    addressee: Profile;
};

export default function FriendsPage() {
    const [friends, setFriends] = useState<Profile[]>([]);
    const [pendingRequests, setPendingRequests] = useState<FriendshipWithProfiles[]>([]);
    const [sentRequests, setSentRequests] = useState<FriendshipWithProfiles[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'friends' | 'pending'>('friends');
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

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
                sessionStorage.setItem('friends-cache', JSON.stringify(friendProfiles));
            }

            // Fetch pending requests
            const { data: pending } = await supabase
                .from('friendships')
                .select('*, requester:profiles!requester_id(*), addressee:profiles!addressee_id(*)')
                .eq('addressee_id', profile.id)
                .eq('status', 'pending');

            const pendingData = (pending as any[]) || [];
            setPendingRequests(pendingData);
            sessionStorage.setItem('pending-requests-cache', JSON.stringify(pendingData));

            // Fetch sent requests
            const { data: sent } = await supabase
                .from('friendships')
                .select('*, requester:profiles!requester_id(*), addressee:profiles!addressee_id(*)')
                .eq('requester_id', profile.id)
                .eq('status', 'pending');

            const sentData = (sent as any[]) || [];
            setSentRequests(sentData);
            sessionStorage.setItem('sent-requests-cache', JSON.stringify(sentData));

            setLoading(false);
        };

        // Cache load
        const friendsCache = sessionStorage.getItem('friends-cache');
        const pendingCache = sessionStorage.getItem('pending-requests-cache');
        const sentCache = sessionStorage.getItem('sent-requests-cache');

        if (friendsCache || pendingCache || sentCache) {
            try {
                if (friendsCache) setFriends(JSON.parse(friendsCache));
                if (pendingCache) setPendingRequests(JSON.parse(pendingCache));
                if (sentCache) setSentRequests(JSON.parse(sentCache));
                setLoading(false);
            } catch (e) {
                console.error(e);
            }
        }

        fetchFriendships();
        const timeout = setTimeout(() => setLoading(false), 6000);
        return () => clearTimeout(timeout);
    }, [profile, supabase]);

    const handleAcceptRequest = async (friendshipId: string) => {
        const { error } = await (supabase as any)
            .from('friendships')
            .update({ status: 'accepted' })
            .eq('id', friendshipId);

        if (!error) {
            const request = pendingRequests.find((r) => r.id === friendshipId);
            if (request) {
                setFriends([...friends, request.requester]);
                setPendingRequests(pendingRequests.filter((r) => r.id !== friendshipId));
                // Notify
                await (supabase as any).from('notifications').insert({
                    user_id: request.requester_id,
                    type: 'friend_accepted',
                    data: { user_id: profile?.id, user_name: profile?.display_name },
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
        const { data, error } = await (supabase as any)
            .from('friendships')
            .insert({ requester_id: profile.id, addressee_id: userId, status: 'pending' })
            .select('*, requester:profiles!requester_id(*), addressee:profiles!addressee_id(*)')
            .single();

        if (!error && data) {
            setSentRequests([...sentRequests, data]);
            await (supabase as any).from('notifications').insert({
                user_id: userId,
                type: 'friend_request',
                data: { user_id: profile.id, user_name: profile.display_name },
            });
        }
    };

    const handleCancelRequest = async (friendshipId: string) => {
        await supabase.from('friendships').delete().eq('id', friendshipId);
        setSentRequests(sentRequests.filter((r) => r.id !== friendshipId));
    };

    const handleRemoveFriend = async (friendId: string) => {
        if (!profile) return;
        await supabase.from('friendships').delete()
            .or(`requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`)
            .or(`requester_id.eq.${friendId},addressee_id.eq.${friendId}`);
        setFriends(friends.filter((f) => f.id !== friendId));
    };

    const handleStartConversation = async (friendId: string) => {
        if (!profile) return;
        const { data: existing } = await supabase.from('conversations').select('id')
            .contains('participant_ids', [profile.id, friendId]).single();

        if (existing) {
            window.location.href = `/messages/${(existing as any).id}`;
            return;
        }

        const { data: newConv } = await (supabase as any).from('conversations')
            .insert({ participant_ids: [profile.id, friendId] }).select('id').single();

        if (newConv) window.location.href = `/messages/${newConv.id}`;
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
                            className="tab"
                            onClick={() => setIsSearchModalOpen(true)}
                        >
                            Add Friends
                        </button>
                    </div>
                </div>

                <div className="friends-content-area animate-fadeIn">
                    {activeTab === 'friends' && (
                        <div className="friends-grid">
                            {loading ? (
                                [1, 2, 3].map((i) => (
                                    <div key={i} className="friend-card skeleton-card">
                                        <div className="skeleton skeleton-avatar-lg" />
                                        <div className="skeleton skeleton-name" />
                                        <div className="skeleton skeleton-handle" />
                                    </div>
                                ))
                            ) : friends.length === 0 ? (
                                <div className="empty-state full-width">
                                    <div className="empty-state-icon"><HandshakeIcon /></div>
                                    <h3 className="empty-state-title">No friends yet</h3>
                                    <p className="empty-state-description">Search for people to add as friends!</p>
                                    <button className="btn btn-primary" onClick={() => setIsSearchModalOpen(true)}>
                                        Find Friends
                                    </button>
                                </div>
                            ) : (
                                <AnimatePresence>
                                    {friends.map((friend, index) => (
                                        <motion.div
                                            key={friend.id}
                                            className="friend-card"
                                            initial={{ opacity: 0, y: 30, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 300,
                                                damping: 25,
                                                delay: index * 0.06,
                                            }}
                                            whileHover={{ y: -4, scale: 1.02 }}
                                        >
                                            <Link href={`/profile/${friend.id}`} className="friend-avatar">
                                                <div className="avatar avatar-xl">
                                                    {friend.avatar_url ? (
                                                        <img src={friend.avatar_url} alt="" />
                                                    ) : (
                                                        <span>{friend.display_name?.[0]?.toUpperCase() || '?'}</span>
                                                    )}
                                                </div>
                                            </Link>
                                            <Link href={`/profile/${friend.id}`} className="friend-name">{friend.display_name}</Link>
                                            <span className="friend-handle">@{friend.username}</span>
                                            <div className="friend-actions">
                                                <button className="btn btn-primary btn-sm" onClick={() => handleStartConversation(friend.id)}>Message</button>
                                                <button className="btn btn-ghost btn-sm" onClick={() => handleRemoveFriend(friend.id)}>Remove</button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            )}
                        </div>
                    )}

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
                                                        <img src={request.requester.avatar_url} alt="" />
                                                    ) : (
                                                        <span>{request.requester.display_name?.[0]?.toUpperCase() || '?'}</span>
                                                    )}
                                                </Link>
                                                <div className="request-info">
                                                    <Link href={`/profile/${request.requester.id}`} className="request-name">{request.requester.display_name}</Link>
                                                    <span className="request-handle">@{request.requester.username}</span>
                                                </div>
                                                <div className="request-actions">
                                                    <button className="btn btn-primary btn-sm" onClick={() => handleAcceptRequest(request.id)}>Accept</button>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => handleDeclineRequest(request.id)}>Decline</button>
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
                                                        <img src={request.addressee.avatar_url} alt="" />
                                                    ) : (
                                                        <span>{request.addressee.display_name?.[0]?.toUpperCase() || '?'}</span>
                                                    )}
                                                </Link>
                                                <div className="request-info">
                                                    <Link href={`/profile/${request.addressee.id}`} className="request-name">{request.addressee.display_name}</Link>
                                                    <span className="request-handle">@{request.addressee.username}</span>
                                                </div>
                                                <button className="btn btn-ghost btn-sm" onClick={() => handleCancelRequest(request.id)}>Cancel</button>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {pendingRequests.length === 0 && sentRequests.length === 0 && (
                                <div className="empty-state">
                                    <div className="empty-state-icon"><MailIcon /></div>
                                    <h3 className="empty-state-title">No pending requests</h3>
                                    <p className="empty-state-description">Friend requests you receive or send will appear here</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <FriendSearchModal
                isOpen={isSearchModalOpen}
                onClose={() => setIsSearchModalOpen(false)}
                onAddFriend={handleSendRequest}
                isFriend={isFriend}
                hasPendingRequest={hasPendingRequest}
            />
        </>
    );
}
