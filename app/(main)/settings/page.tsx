'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useTheme } from '@/components/providers/ThemeProvider';
import './settings.css';

const AppearanceIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        <path d="M5 3v4" />
        <path d="M19 17v4" />
        <path d="M3 5h4" />
        <path d="M17 19h4" />
    </svg>
);

const SecurityIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const { compactMode, setCompactMode, deleteAccount } = useAuth();

    const handleDeleteAccount = async () => {
        const confirmed = window.confirm(
            'Are you absolutely sure you want to delete your account? This action is permanent and cannot be undone. All your posts, messages, and friend connections will be removed.'
        );

        if (confirmed) {
            const { error } = await deleteAccount();
            if (error) {
                alert('Failed to delete account. Please try again or contact support.');
            }
        }
    };

    return (
        <div className="settings-container animate-fadeIn">
            <header className="page-header">
                <h1 className="page-title">Settings</h1>
                <p className="page-subtitle">Customize your experience and manage your account.</p>
            </header>

            <div className="settings-grid">
                <section className="settings-group">
                    <h3 className="section-title">Appearance</h3>
                    <div className="settings-card">
                        <div className="card-header">
                            <div className="card-icon"><AppearanceIcon /></div>
                            <div>
                                <div className="card-title">Theme System</div>
                                <p className="card-description">Choose how Andcord looks to you.</p>
                            </div>
                        </div>

                        <div className="theme-options">
                            <div
                                className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                                onClick={() => setTheme('light')}
                            >
                                <div className="theme-preview preview-light"></div>
                                <span className="control-label">Light Mode</span>
                            </div>
                            <div
                                className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                                onClick={() => setTheme('dark')}
                            >
                                <div className="theme-preview preview-dark"></div>
                                <span className="control-label">Dark Mode</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="settings-group">
                    <h3 className="section-title">Preferences</h3>
                    <div className="settings-card">
                        <div className="settings-control">
                            <div className="control-info">
                                <span className="control-label">Compact Mode</span>
                                <p className="control-description">Reduce spacing to see more content at once.</p>
                            </div>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={compactMode}
                                    onChange={(e) => setCompactMode(e.target.checked)}
                                />
                                <span className="slider"></span>
                            </label>
                        </div>
                    </div>
                </section>

                <section className="settings-group danger-zone">
                    <h3 className="section-title text-error">Danger Zone</h3>
                    <div className="settings-card border-error">
                        <div className="settings-control">
                            <div className="control-info">
                                <span className="control-label text-error">Delete Account</span>
                                <p className="control-description">Permanently remove your account and all data.</p>
                            </div>
                            <button className="btn-premium-danger" onClick={handleDeleteAccount}>
                                Delete Account
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
