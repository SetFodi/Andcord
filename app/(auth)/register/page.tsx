'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import '../auth.css';

// Professional SVG icons
const RocketIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
        <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
);

const ShieldIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
    </svg>
);

const SparkleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" />
    </svg>
);

export default function RegisterPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const { signUp } = useAuth();
    const router = useRouter();

    const validateForm = (): string | null => {
        if (username.length < 3) {
            return 'Username must be at least 3 characters';
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return 'Username can only contain letters, numbers, and underscores';
        }
        if (password.length < 6) {
            return 'Password must be at least 6 characters';
        }
        if (password !== confirmPassword) {
            return 'Passwords do not match';
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);

        const { error } = await signUp(email, password, username);

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        setSuccess(true);
        // We redirect to login after a delay so they can read the message
        // Pre-filling the email in the login page helps the user
        setTimeout(() => {
            router.push(`/login?email=${encodeURIComponent(email)}`);
        }, 5000); // Give them 5 seconds to read the confirmation message
    };

    if (success) {
        return (
            <div className="auth-container">
                <div className="auth-branding">
                    <div className="branding-glow"></div>
                    <div className="branding-glow secondary"></div>
                    <div className="planet"></div>
                    <div className="comet"></div>
                    <div className="branding-wrapper">
                        <div className="branding-logo">
                            <span className="logo-icon">✦</span>
                            <span className="logo-text">Andcord</span>
                        </div>
                        <div className="branding-hero">
                            <h1 className="hero-title">
                                Welcome to
                                <span className="hero-highlight">the community</span>
                            </h1>
                        </div>
                    </div>
                </div>
                <div className="auth-form-panel">
                    <div className="auth-card">
                        <div className="auth-success">
                            <div className="auth-success-icon">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                            <h2>Verify your email</h2>
                            <p>
                                We&apos;ve sent a confirmation link to <strong>{email}</strong>.
                                <br />
                                Please check your inbox to activate your account.
                            </p>
                            <div className="auth-redirect-hint">Redirecting to login...</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            {/* Left Panel - Branding */}
            <div className="auth-branding">
                <div className="branding-glow"></div>
                <div className="branding-glow secondary"></div>
                <div className="planet"></div>
                <div className="comet"></div>

                <div className="branding-wrapper">
                    <div className="branding-logo">
                        <span className="logo-icon">✦</span>
                        <span className="logo-text">Andcord</span>
                    </div>

                    <div className="branding-hero">
                        <h1 className="hero-title">
                            Start your
                            <span className="hero-highlight">journey today</span>
                        </h1>
                        <p className="hero-description">
                            Join thousands of people already connecting on Andcord.
                        </p>
                    </div>

                    <div className="branding-features">
                        <div className="feature">
                            <span className="feature-icon"><RocketIcon /></span>
                            <span>Quick setup</span>
                        </div>
                        <div className="feature">
                            <span className="feature-icon"><ShieldIcon /></span>
                            <span>Secure & private</span>
                        </div>
                        <div className="feature">
                            <span className="feature-icon"><SparkleIcon /></span>
                            <span>Free forever</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="auth-form-panel">
                <div className="auth-card">
                    <div className="auth-header">
                        <h1 className="auth-title">Create account</h1>
                        <p className="auth-subtitle">
                            Already have an account? <Link href="/login">Sign in</Link>
                        </p>
                    </div>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        {error && <div className="auth-error">{error}</div>}

                        <div className="form-group">
                            <label className="form-label" htmlFor="username">
                                Username
                            </label>
                            <input
                                id="username"
                                type="text"
                                className="form-input"
                                placeholder="Choose a username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                                required
                                autoComplete="username"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="email">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                className="form-input"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="password">
                                Password
                            </label>
                            <div className="password-wrapper">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-input"
                                    placeholder="Create a password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                        </svg>
                                    ) : (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="confirmPassword">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                type={showPassword ? 'text' : 'password'}
                                className="form-input"
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                autoComplete="new-password"
                            />
                        </div>

                        <button
                            type="submit"
                            className="auth-button"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner" />
                                    Creating account...
                                </>
                            ) : (
                                'Create account'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
