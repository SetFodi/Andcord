'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { formatRelativeTime } from '@/lib/utils/formatDate';
import type { Notification } from '@/types/database';
import './notifications.css';

// Icons
const BellIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
);

const HeartIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
);

const MessageCircleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
);

const HandshakeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m11 17 2 2a1 1 0 1 0 3-3" />
        <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-1.42-1.42l4.88-4.88a3 3 0 0 0 0-4.24l2.12-2.12a2 2 0 0 1 2.83 0l7.25 7.25a2 2 0 0 1 0 2.83l-3.75 3.75a2 2 0 0 1-2.83 0" />
        <path d="m5.9 18.37 2.83 2.83a2 2 0 0 0 2.83 0l6.5-6.5" />
        <path d="M12 9a2 2 0 0 0-3-3l-2.12 2.12a2 2 0 0 0 0 2.83 1 1 0 0 0-1.41-1.41 1 1 0 0 0 0 1.41l-2.12 2.12a2 2 0 0 0 0 2.83l3.75 3.75a2 2 0 0 0 2.83 0" />
    </svg>
);

const CheckCircleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

const MailIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
    </svg>
);

const UsersIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const DefaultBellIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
);

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const { profile } = useAuth();
    const supabase = createClient();

    useEffect(() => {
        const fetchNotifications = async () => {
            if (!profile) return;

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', profile.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.error('Error fetching notifications:', error);
                return;
            }

            setNotifications(data || []);
            setLoading(false);

            // Mark all as read
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any)
                .from('notifications')
                .update({ read: true })
                .eq('user_id', profile.id)
                .eq('read', false);
        };

        fetchNotifications();

        // Timeout fallback
        const timeout = setTimeout(() => {
            setLoading(false);
        }, 6000);

        return () => clearTimeout(timeout);
    }, [profile, supabase]);

    // Real-time subscription for new notifications
    useEffect(() => {
        if (!profile) return;

        const channel = supabase
            .channel('notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${profile.id}`,
                },
                (payload) => {
                    setNotifications((prev) => [payload.new as Notification, ...prev]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [profile, supabase]);

    const getNotificationContent = (notification: Notification) => {
        const data = notification.data as Record<string, string>;

        switch (notification.type) {
            case 'like':
                return {
                    icon: <HeartIcon />,
                    iconClass: 'icon-like',
                    title: `${data.liker_name || 'Someone'} liked your post`,
                    link: `/feed`,
                };
            case 'comment':
                return {
                    icon: <MessageCircleIcon />,
                    iconClass: 'icon-comment',
                    title: `${data.commenter_name || 'Someone'} commented on your post`,
                    description: data.comment_preview,
                    link: `/feed`,
                };
            case 'friend_request':
                return {
                    icon: <HandshakeIcon />,
                    iconClass: 'icon-friend-request',
                    title: `${data.user_name || 'Someone'} sent you a friend request`,
                    link: `/friends`,
                };
            case 'friend_accepted':
                return {
                    icon: <CheckCircleIcon />,
                    iconClass: 'icon-friend-accepted',
                    title: `${data.user_name || 'Someone'} accepted your friend request`,
                    link: `/friends`,
                };
            case 'message':
                return {
                    icon: <MailIcon />,
                    iconClass: 'icon-message',
                    title: `${data.sender_name || 'Someone'} sent you a message`,
                    description: data.message_preview,
                    link: `/messages/${data.conversation_id}`,
                };
            case 'group_invite':
                return {
                    icon: <UsersIcon />,
                    iconClass: 'icon-group',
                    title: `You were invited to join ${data.group_name || 'a group'}`,
                    link: `/groups`,
                };
            default:
                return {
                    icon: <DefaultBellIcon />,
                    iconClass: 'icon-default',
                    title: 'New notification',
                    link: `/feed`,
                };
        }
    };

    const handleClearAll = async () => {
        if (!profile) return;

        await supabase
            .from('notifications')
            .delete()
            .eq('user_id', profile.id);

        setNotifications([]);
    };

    return (
        <>
            <header className="page-header" style={{ textAlign: 'center' }}>
                <h1 className="page-title">Notifications</h1>
                {notifications.length > 0 && (
                    <button className="btn btn-ghost btn-sm" onClick={handleClearAll}>
                        Clear All
                    </button>
                )}
            </header>

            <div className="page-content">
                <div className="notifications-container">
                    {loading ? (
                        <>
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="notification-skeleton">
                                    <div className="skeleton skeleton-icon" />
                                    <div className="skeleton-content">
                                        <div className="skeleton skeleton-title" />
                                        <div className="skeleton skeleton-time" />
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : notifications.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon"><BellIcon /></div>
                            <h3 className="empty-state-title">No notifications</h3>
                            <p className="empty-state-description">
                                You&apos;re all caught up! New notifications will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="notifications-list">
                            {notifications.map((notification) => {
                                const content = getNotificationContent(notification);
                                return (
                                    <Link
                                        key={notification.id}
                                        href={content.link}
                                        className={`notification-item ${!notification.read ? 'unread' : ''}`}
                                    >
                                        <div className={`notification-icon ${content.iconClass}`}>{content.icon}</div>
                                        <div className="notification-content">
                                            <p className="notification-title">{content.title}</p>
                                            {content.description && (
                                                <p className="notification-description">{content.description}</p>
                                            )}
                                            <span className="notification-time">
                                                {formatRelativeTime(notification.created_at)}
                                            </span>
                                        </div>
                                        {!notification.read && <div className="notification-dot" />}
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
