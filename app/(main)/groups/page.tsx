'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { formatMessageTime } from '@/lib/utils/formatDate';
import type { Group, GroupMessage, GroupMember, Profile } from '@/types/database';
import './groups.css';

// Icons
const PlusIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const SettingsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
);

const GroupIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const CloseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const SendIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
);

type GroupWithDetails = Group & {
    members: (GroupMember & { user: Profile })[];
    member_count: number;
};

export default function GroupsPage() {
    const [groups, setGroups] = useState<GroupWithDetails[]>([]);
    const [activeGroup, setActiveGroup] = useState<GroupWithDetails | null>(null);
    const [messages, setMessages] = useState<GroupMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [creating, setCreating] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { profile } = useAuth();
    const supabase = createClient();

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    // Fetch groups
    const fetchGroups = useCallback(async () => {
        if (!profile) return;

        // Get groups where user is a member
        const { data: memberOf } = await supabase
            .from('group_members')
            .select('group_id')
            .eq('user_id', profile.id);

        if (!memberOf || memberOf.length === 0) {
            setGroups([]);
            setLoading(false);
            sessionStorage.removeItem('groups-cache'); // Clear cache if no groups
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const groupIds = (memberOf as any[]).map((m) => m.group_id);

        const { data: groupsData } = await supabase
            .from('groups')
            .select(`
        *,
        members:group_members(*, user:profiles(*))
      `)
            .in('id', groupIds);

        if (groupsData) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const enriched = (groupsData as any[]).map((g) => ({
                ...g,
                member_count: g.members?.length || 0,
            }));
            setGroups(enriched);
            sessionStorage.setItem('groups-cache', JSON.stringify(enriched));
        }

        setLoading(false);
    }, [profile, supabase]);

    // Fetch messages for active group
    const fetchMessages = useCallback(async (groupId: string) => {
        const { data } = await supabase
            .from('group_messages')
            .select('*, sender:profiles(*)')
            .eq('group_id', groupId)
            .order('created_at', { ascending: true });

        setMessages(data || []);
        setTimeout(scrollToBottom, 100);
    }, [supabase, scrollToBottom]);

    useEffect(() => {
        // Try to load from cache
        const cached = sessionStorage.getItem('groups-cache');
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                setGroups(parsed);
                setLoading(false);
            } catch (e) {
                console.error('Cache parse error', e);
            }
        }

        if (profile) {
            fetchGroups();
        }

        // Timeout fallback
        const timeout = setTimeout(() => {
            setLoading(false);
        }, 6000);

        return () => clearTimeout(timeout);
    }, [fetchGroups, profile]);

    // Real-time subscription for group messages
    useEffect(() => {
        if (!activeGroup) return;

        const channel = supabase
            .channel(`group-messages:${activeGroup.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'group_messages',
                    filter: `group_id=eq.${activeGroup.id}`,
                },
                async (payload) => {
                    const { data: newMsg } = await supabase
                        .from('group_messages')
                        .select('*, sender:profiles(*)')
                        .eq('id', payload.new.id)
                        .single();

                    if (newMsg) {
                        setMessages((prev) => [...prev, newMsg]);
                        scrollToBottom();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeGroup, supabase, scrollToBottom]);

    const handleSelectGroup = (group: GroupWithDetails) => {
        setActiveGroup(group);
        fetchMessages(group.id);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile || !activeGroup || !newMessage.trim() || sending) return;

        setSending(true);
        const messageContent = newMessage.trim();
        setNewMessage('');

        try {
            // @ts-expect-error - Types will be available after Supabase DB setup
            await supabase.from('group_messages').insert({
                group_id: activeGroup.id,
                sender_id: profile.id,
                content: messageContent,
            });
        } catch (error) {
            console.error('Error sending message:', error);
            setNewMessage(messageContent);
        } finally {
            setSending(false);
        }
    };

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile || !newGroupName.trim() || creating) return;

        console.log('Starting group creation for user:', profile.id);
        console.log('Group Name:', newGroupName.trim());
        setCreating(true);

        try {
            // Create group using RPC function (bypasses RLS recursion issues)
            console.log('Creating group via RPC function...');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: newGroup, error: groupError } = await (supabase as any)
                .rpc('create_group_with_owner', {
                    p_name: newGroupName.trim(),
                    p_owner_id: profile.id,
                });

            if (groupError) {
                console.error('Supabase RPC error:', JSON.stringify(groupError, null, 2));
                console.error('Error code:', groupError.code);
                console.error('Error hint:', groupError.hint);
                console.error('Error details:', groupError.details);
                throw groupError;
            }

            console.log('Group created successfully:', newGroup);
            if (!newGroup) throw new Error('Failed to create group record');
            setShowCreateModal(false);
            setNewGroupName('');
            fetchGroups();
        } catch (error: any) {
            console.error('Error creating group:', error.message || error);
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="groups-layout">
            {/* Groups Sidebar */}
            <aside className="groups-sidebar">
                <div className="groups-header">
                    <h2>Groups</h2>
                    <button
                        className="btn-new-group"
                        onClick={() => setShowCreateModal(true)}
                        title="Create New Group"
                    >
                        <PlusIcon />
                    </button>
                </div>

                <div className="groups-list">
                    {loading ? (
                        <>
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="group-skeleton">
                                    <div className="skeleton skeleton-avatar" />
                                    <div className="skeleton-content">
                                        <div className="skeleton skeleton-name" />
                                        <div className="skeleton skeleton-members" />
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : groups.length === 0 ? (
                        <div className="empty-groups">
                            <p className="text-muted text-sm text-center py-4">No groups found</p>
                        </div>
                    ) : (
                        groups.map((group) => {
                            const isActive = activeGroup?.id === group.id;
                            return (
                                <button
                                    key={group.id}
                                    className={`group-item ${isActive ? 'active' : ''}`}
                                    onClick={() => handleSelectGroup(group)}
                                >
                                    <div className="avatar">
                                        {group.avatar_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={group.avatar_url} alt="" />
                                        ) : (
                                            <span>{group.name[0].toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div className="group-info">
                                        <span className="group-name">{group.name}</span>
                                        <span className="group-members">{group.member_count} members</span>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </aside>

            {/* Group Chat Area */}
            <main className="group-chat-area">
                {activeGroup ? (
                    <>
                        <header className="group-chat-header">
                            <div className="avatar avatar-md">
                                {activeGroup.avatar_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={activeGroup.avatar_url} alt="" />
                                ) : (
                                    <span>{activeGroup.name[0].toUpperCase()}</span>
                                )}
                            </div>
                            <div className="group-details">
                                <span className="group-title">{activeGroup.name}</span>
                                <span className="group-member-count">
                                    {activeGroup.member_count} members
                                </span>
                            </div>
                            <button className="btn btn-ghost btn-icon" title="Group settings">
                                <SettingsIcon />
                            </button>
                        </header>

                        <div className="group-messages-container">
                            <div className="group-messages-list">
                                {messages.map((message, index) => {
                                    const isOwn = message.sender_id === profile?.id;
                                    const showAvatar = index === 0 || messages[index - 1]?.sender_id !== message.sender_id;

                                    return (
                                        <div
                                            key={message.id}
                                            className={`group-message ${isOwn ? 'own' : 'other'} ${showAvatar ? 'with-avatar' : ''}`}
                                        >
                                            {!isOwn && showAvatar && (
                                                <Link href={`/profile/${message.sender?.id}`} className="avatar avatar-sm">
                                                    {message.sender?.avatar_url ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={message.sender.avatar_url} alt="" />
                                                    ) : (
                                                        <span>{message.sender?.display_name?.[0]?.toUpperCase() || '?'}</span>
                                                    )}
                                                </Link>
                                            )}
                                            <div className="group-message-content">
                                                {!isOwn && showAvatar && (
                                                    <span className="message-sender">{message.sender?.display_name}</span>
                                                )}
                                                <div className="message-bubble">
                                                    <p>{message.content}</p>
                                                    <span className="message-time">{formatMessageTime(message.created_at)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        <form className="group-message-form" onSubmit={handleSendMessage}>
                            <input
                                type="text"
                                className="message-input"
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                            />
                            <button
                                type="submit"
                                className="btn btn-primary btn-icon"
                                disabled={!newMessage.trim() || sending}
                            >
                                {sending ? '...' : <SendIcon />}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="group-empty">
                        <div className="empty-state">
                            <div className="empty-state-icon"><GroupIcon /></div>
                            <h3 className="empty-state-title">Select a group</h3>
                            <p className="empty-state-description">
                                Choose a group from the sidebar or click below to start a new community.
                            </p>
                            <button
                                className="btn-create-large"
                                onClick={() => setShowCreateModal(true)}
                            >
                                <span className="flex items-center gap-sm">
                                    <PlusIcon /> Create Your First Group
                                </span>
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* Create Group Modal */}
            {showCreateModal && (
                <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-glass-card" onClick={(e) => e.stopPropagation()}>
                        <h3 className="modal-title">Create Group</h3>

                        <form onSubmit={handleCreateGroup} className="modal-form">
                            <div className="form-group">
                                <label className="modal-label">Group Name</label>
                                <input
                                    type="text"
                                    className="modal-input-glass"
                                    placeholder="Enter group name"
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    autoFocus
                                    maxLength={30}
                                />
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-modal-ghost"
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-modal-primary"
                                    disabled={!newGroupName.trim() || creating}
                                >
                                    {creating ? 'Creating...' : 'Create Group'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
