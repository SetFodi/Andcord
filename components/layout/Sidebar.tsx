'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/hooks/useAuth';
import './sidebar.css';

// SVG Icons
const HomeIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
);

const MessageIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);

const UsersIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const FriendsIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const BellIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
);

const SettingsIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
);

const LogoutIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);

const SparkleIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L13.09 8.26L18 6L14.74 10.91L21 12L14.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L9.26 13.09L3 12L9.26 10.91L6 6L10.91 8.26L12 2Z" />
    </svg>
);

const ProfileIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

const HelpIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);

// Main navigation items
const mainNavItems = [
    { href: '/feed', label: 'Feed', icon: <HomeIcon /> },
    { href: '/messages', label: 'Messages', icon: <MessageIcon /> },
    { href: '/groups', label: 'Groups', icon: <UsersIcon /> },
    { href: '/friends', label: 'Friends', icon: <FriendsIcon /> },
    { href: '/notifications', label: 'Notifications', icon: <BellIcon /> },
    { href: '/contact', label: 'Help & Support', icon: <HelpIcon /> },
];

// Bottom navigation items for mobile
const bottomNavItems = [
    { href: '/feed', label: 'Feed', icon: <HomeIcon /> },
    { href: '/messages', label: 'Messages', icon: <MessageIcon /> },
    { href: '/friends', label: 'Friends', icon: <FriendsIcon /> },
    { href: '/notifications', label: 'Alerts', icon: <BellIcon /> },
    { href: '/profile', label: 'Profile', icon: <ProfileIcon /> },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { profile, signOut } = useAuth();

    return (
        <>
            {/* Desktop/Tablet Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <Link href="/feed" className="sidebar-logo">
                        <span className="logo-icon"><SparkleIcon /></span>
                        <span className="logo-text">Andcord</span>
                    </Link>
                </div>

                <nav className="sidebar-nav">
                    {mainNavItems.map((item, index) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <motion.div
                                key={item.href}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 300,
                                    damping: 25,
                                    delay: index * 0.05,
                                }}
                            >
                                <Link
                                    href={item.href}
                                    className={`nav-item ${isActive ? 'active' : ''}`}
                                >
                                    <span className="nav-icon">{item.icon}</span>
                                    <span className="nav-label">{item.label}</span>
                                </Link>
                            </motion.div>
                        );
                    })}

                    <div className="sidebar-divider" />

                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 25,
                            delay: mainNavItems.length * 0.05,
                        }}
                    >
                        <Link
                            href="/settings"
                            className={`nav-item ${pathname.startsWith('/settings') ? 'active' : ''}`}
                        >
                            <span className="nav-icon"><SettingsIcon /></span>
                            <span className="nav-label">Settings</span>
                        </Link>
                    </motion.div>
                </nav>

                <div className="sidebar-footer">
                    <Link href="/profile" className="user-profile">
                        <div className="avatar avatar-md">
                            {profile?.avatar_url ? (
                                <Image
                                    src={profile.avatar_url}
                                    alt={profile.display_name || 'Avatar'}
                                    width={40}
                                    height={40}
                                    className="avatar-image"
                                />
                            ) : (
                                <span>{profile?.display_name?.[0]?.toUpperCase() || '?'}</span>
                            )}
                        </div>
                        <span className="avatar-status" />
                        <div className="user-info">
                            <span className="user-name">{profile?.display_name || 'User'}</span>
                            <span className="user-handle">@{profile?.username || 'username'}</span>
                        </div>
                    </Link>
                    <button className="logout-btn" onClick={signOut} title="Sign out">
                        <LogoutIcon />
                    </button>
                </div>
            </aside>

            {/* Mobile Bottom Navigation */}
            <nav className="bottom-nav">
                <div className="bottom-nav-items">
                    {bottomNavItems.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`bottom-nav-item ${isActive ? 'active' : ''}`}
                            >
                                <span className="bottom-nav-icon">{item.icon}</span>
                                <span className="bottom-nav-label">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
