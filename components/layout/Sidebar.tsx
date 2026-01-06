'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import './sidebar.css';

const navItems = [
    { href: '/feed', label: 'Feed', icon: '🏠' },
    { href: '/messages', label: 'Messages', icon: '💬' },
    { href: '/groups', label: 'Groups', icon: '👥' },
    { href: '/friends', label: 'Friends', icon: '🤝' },
    { href: '/notifications', label: 'Notifications', icon: '🔔' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { profile, signOut } = useAuth();

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <Link href="/feed" className="sidebar-logo">
                    <span className="logo-icon">⚡</span>
                    <span className="logo-text">Andcord</span>
                </Link>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`nav-item ${isActive ? 'active' : ''}`}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="sidebar-footer">
                <Link href="/profile" className="user-profile">
                    <div className="avatar avatar-md">
                        {profile?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={profile.avatar_url} alt={profile.display_name || 'Avatar'} />
                        ) : (
                            <span>{profile?.display_name?.[0]?.toUpperCase() || '?'}</span>
                        )}
                    </div>
                    <div className="user-info">
                        <span className="user-name">{profile?.display_name || 'User'}</span>
                        <span className="user-handle">@{profile?.username || 'username'}</span>
                    </div>
                </Link>
                <button className="btn btn-ghost btn-icon logout-btn" onClick={signOut} title="Sign out">
                    🚪
                </button>
            </div>
        </aside>
    );
}
