'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { formatRelativeTime } from '@/lib/utils/formatDate';
import type { Notification } from '@/types/database';
import './notifications.css';

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
                    icon: '❤️',
                    title: `${data.liker_name || 'Someone'} liked your post`,
                    link: `/feed`,
                };
            case 'comment':
                return {
                    icon: '💬',
                    title: `${data.commenter_name || 'Someone'} commented on your post`,
                    description: data.comment_preview,
                    link: `/feed`,
                };
            case 'friend_request':
                return {
                    icon: '🤝',
                    title: `${data.user_name || 'Someone'} sent you a friend request`,
                    link: `/friends`,
                };
            case 'friend_accepted':
                return {
                    icon: '✅',
                    title: `${data.user_name || 'Someone'} accepted your friend request`,
                    link: `/friends`,
                };
            case 'message':
                return {
                    icon: '📩',
                    title: `${data.sender_name || 'Someone'} sent you a message`,
                    description: data.message_preview,
                    link: `/messages/${data.conversation_id}`,
                };
            case 'group_invite':
                return {
                    icon: '👥',
                    title: `You were invited to join ${data.group_name || 'a group'}`,
                    link: `/groups`,
                };
            default:
                return {
                    icon: '🔔',
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
            <header className="page-header">
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
                            <div className="empty-state-icon">🔔</div>
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
                                        <div className="notification-icon">{content.icon}</div>
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
