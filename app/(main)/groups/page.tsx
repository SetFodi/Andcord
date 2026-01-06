'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { formatMessageTime } from '@/lib/utils/formatDate';
import type { Group, GroupMessage, GroupMember, Profile } from '@/types/database';
import './groups.css';

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
        if (profile) {
            fetchGroups();
        }
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

        setCreating(true);

        try {
            // Create group
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: newGroup, error: groupError } = await (supabase as any)
                .from('groups')
                .insert({
                    name: newGroupName.trim(),
                    owner_id: profile.id,
                })
                .select()
                .single();

            if (groupError || !newGroup) throw groupError;

            // Add creator as member
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any).from('group_members').insert({
                group_id: (newGroup as { id: string }).id,
                user_id: profile.id,
                role: 'owner',
            });

            setShowCreateModal(false);
            setNewGroupName('');
            fetchGroups();
        } catch (error) {
            console.error('Error creating group:', error);
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
                        className="btn btn-primary btn-sm"
                        onClick={() => setShowCreateModal(true)}
                    >
                        + New
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
                            <p>No groups yet</p>
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => setShowCreateModal(true)}
                            >
                                Create a Group
                            </button>
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
                                    <div className="avatar avatar-md">
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
                                ⚙️
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
                                {sending ? '...' : '➤'}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="group-empty">
                        <div className="empty-state">
                            <div className="empty-state-icon">👥</div>
                            <h3 className="empty-state-title">Select a group</h3>
                            <p className="empty-state-description">
                                Choose a group from the sidebar or create a new one
                            </p>
                        </div>
                    </div>
                )}
            </main>

            {/* Create Group Modal */}
            {showCreateModal && (
                <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Create Group</h3>
                            <button
                                className="btn btn-ghost btn-icon"
                                onClick={() => setShowCreateModal(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleCreateGroup}>
                            <div className="modal-body">
                                <div className="input-group">
                                    <label className="input-label">Group Name</label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="Enter group name"
                                        value={newGroupName}
                                        onChange={(e) => setNewGroupName(e.target.value)}
                                        maxLength={50}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-ghost"
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={!newGroupName.trim() || creating}
                                >
                                    {creating ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
