'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { formatMessageTime, formatConversationDate } from '@/lib/utils/formatDate';
import type { Conversation, Message, Profile } from '@/types/database';
import './messages.css';

// Icons
const EditIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

const MoreIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
        <circle cx="5" cy="12" r="1" />
    </svg>
);

const AttachmentIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
);

const SendIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
);

const MessageIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);

export default function MessagesPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [otherUser, setOtherUser] = useState<Profile | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { profile } = useAuth();
    const supabase = createClient();
    const params = useParams();
    const conversationId = params?.conversationId as string | undefined;

    // Scroll to bottom of messages
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    // Fetch conversations
    const fetchConversations = useCallback(async () => {
        if (!profile) return;

        const { data, error } = await supabase
            .from('conversations')
            .select('*')
            .contains('participant_ids', [profile.id])
            .order('last_message_at', { ascending: false });

        if (error || !data) {
            console.error('Error fetching conversations:', error);
            return;
        }

        // Fetch participant profiles and last message for each conversation
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const enrichedConversations = await Promise.all(
            (data as any[]).map(async (conv) => {
                const otherParticipantId = conv.participant_ids.find((id: string) => id !== profile.id);

                const [{ data: participants }, { data: lastMessage }] = await Promise.all([
                    supabase
                        .from('profiles')
                        .select('*')
                        .in('id', conv.participant_ids),
                    supabase
                        .from('messages')
                        .select('*')
                        .eq('conversation_id', conv.id)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .single()
                ]);

                return {
                    ...conv,
                    participants,
                    last_message: lastMessage,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    other_user: (participants as any[] || []).find((p: Profile) => p.id === otherParticipantId),
                };
            })
        );

        setConversations(enrichedConversations);
        setLoading(false);
    }, [profile, supabase]);

    // Fetch messages for active conversation
    const fetchMessages = useCallback(async (convId: string) => {
        const { data, error } = await supabase
            .from('messages')
            .select('*, sender:profiles(*)')
            .eq('conversation_id', convId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching messages:', error);
            return;
        }

        setMessages(data || []);
        setTimeout(scrollToBottom, 100);
    }, [supabase, scrollToBottom]);

    // Initial load
    useEffect(() => {
        if (profile) {
            fetchConversations();
        }

        // Timeout fallback
        const timeout = setTimeout(() => {
            setLoading(false);
        }, 6000);

        return () => clearTimeout(timeout);
    }, [fetchConversations, profile]);

    // Handle URL-based conversation selection
    useEffect(() => {
        if (conversationId && conversations.length > 0) {
            const conv = conversations.find((c) => c.id === conversationId);
            if (conv) {
                setActiveConversation(conv);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setOtherUser((conv as any).other_user || null);
                fetchMessages(conversationId);
            }
        }
    }, [conversationId, conversations, fetchMessages]);

    // Real-time subscription for messages
    useEffect(() => {
        if (!activeConversation) return;

        const channel = supabase
            .channel(`messages:${activeConversation.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${activeConversation.id}`,
                },
                async (payload) => {
                    const { data: newMsg } = await supabase
                        .from('messages')
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
    }, [activeConversation, supabase, scrollToBottom]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile || !activeConversation || !newMessage.trim() || sending) return;

        setSending(true);
        const messageContent = newMessage.trim();
        setNewMessage('');

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase as any).from('messages').insert({
                conversation_id: activeConversation.id,
                sender_id: profile.id,
                content: messageContent,
            });

            if (error) throw error;

            // Update conversation's last_message_at
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any)
                .from('conversations')
                .update({ last_message_at: new Date().toISOString() })
                .eq('id', activeConversation.id);

            // Create notification for other user
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const otherId = (activeConversation as any).participant_ids?.find((id: string) => id !== profile.id);
            if (otherId) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (supabase as any).from('notifications').insert({
                    user_id: otherId,
                    type: 'message',
                    data: {
                        conversation_id: activeConversation.id,
                        sender_id: profile.id,
                        sender_name: profile.display_name,
                        message_preview: messageContent.slice(0, 50),
                    },
                });
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setNewMessage(messageContent);
        } finally {
            setSending(false);
        }
    };

    const selectConversation = (conv: Conversation) => {
        setActiveConversation(conv);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setOtherUser((conv as any).other_user || null);
        fetchMessages(conv.id);
        window.history.pushState({}, '', `/messages/${conv.id}`);
    };

    return (
        <div className="messages-layout">
            {/* Conversations Sidebar */}
            <aside className="conversations-sidebar">
                <div className="conversations-header">
                    <h2>Messages</h2>
                    <button className="btn btn-ghost btn-icon" title="New message">
                        <EditIcon />
                    </button>
                </div>

                <div className="conversations-list">
                    {loading ? (
                        <>
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="conversation-skeleton">
                                    <div className="skeleton skeleton-avatar" />
                                    <div className="skeleton-content">
                                        <div className="skeleton skeleton-name" />
                                        <div className="skeleton skeleton-message" />
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : conversations.length === 0 ? (
                        <div className="empty-conversations">
                            <p>No conversations yet</p>
                        </div>
                    ) : (
                        conversations.map((conv) => {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const other = (conv as any).other_user as Profile | undefined;
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const lastMsg = (conv as any).last_message as Message | undefined;
                            const isActive = activeConversation?.id === conv.id;

                            return (
                                <button
                                    key={conv.id}
                                    className={`conversation-item ${isActive ? 'active' : ''}`}
                                    onClick={() => selectConversation(conv)}
                                >
                                    <div className="avatar avatar-md">
                                        {other?.avatar_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={other.avatar_url} alt="" />
                                        ) : (
                                            <span>{other?.display_name?.[0]?.toUpperCase() || '?'}</span>
                                        )}
                                    </div>
                                    <div className="conversation-info">
                                        <div className="conversation-header">
                                            <span className="conversation-name">{other?.display_name || 'Unknown'}</span>
                                            {lastMsg && (
                                                <span className="conversation-time">
                                                    {formatConversationDate(lastMsg.created_at)}
                                                </span>
                                            )}
                                        </div>
                                        {lastMsg && (
                                            <p className="conversation-preview">
                                                {lastMsg.sender_id === profile?.id ? 'You: ' : ''}
                                                {lastMsg.content}
                                            </p>
                                        )}
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </aside>

            {/* Chat Area */}
            <main className="chat-area">
                {activeConversation ? (
                    <>
                        {/* Chat Header */}
                        <header className="chat-header">
                            <Link href={`/profile/${otherUser?.id}`} className="chat-user">
                                <div className="avatar avatar-md">
                                    {otherUser?.avatar_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={otherUser.avatar_url} alt="" />
                                    ) : (
                                        <span>{otherUser?.display_name?.[0]?.toUpperCase() || '?'}</span>
                                    )}
                                </div>
                                <div className="user-details">
                                    <span className="user-name">{otherUser?.display_name || 'Unknown'}</span>
                                    <span className="user-status">@{otherUser?.username}</span>
                                </div>
                            </Link>
                            <div className="chat-actions">
                                <button className="btn btn-ghost btn-icon" title="More options">
                                    <MoreIcon />
                                </button>
                            </div>
                        </header>

                        {/* Messages */}
                        <div className="messages-container">
                            <div className="messages-list">
                                {messages.map((message, index) => {
                                    const isOwn = message.sender_id === profile?.id;
                                    const showAvatar = index === 0 || messages[index - 1]?.sender_id !== message.sender_id;

                                    return (
                                        <div
                                            key={message.id}
                                            className={`message ${isOwn ? 'own' : 'other'} ${showAvatar ? 'with-avatar' : ''}`}
                                        >
                                            {!isOwn && showAvatar && (
                                                <div className="avatar avatar-sm">
                                                    {message.sender?.avatar_url ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={message.sender.avatar_url} alt="" />
                                                    ) : (
                                                        <span>{message.sender?.display_name?.[0]?.toUpperCase() || '?'}</span>
                                                    )}
                                                </div>
                                            )}
                                            <div className="message-bubble">
                                                <p className="message-content">{message.content}</p>
                                                <span className="message-time">{formatMessageTime(message.created_at)}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Message Input */}
                        <form className="message-form" onSubmit={handleSendMessage}>
                            <button type="button" className="btn btn-ghost btn-icon" title="Add attachment">
                                <AttachmentIcon />
                            </button>
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
                                title="Send message"
                            >
                                {sending ? '...' : <SendIcon />}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="chat-empty">
                        <div className="empty-state">
                            <div className="empty-state-icon"><MessageIcon /></div>
                            <h3 className="empty-state-title">Select a conversation</h3>
                            <p className="empty-state-description">
                                Choose a conversation from the sidebar to start messaging
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
