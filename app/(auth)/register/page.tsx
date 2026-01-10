'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import '../auth.css';

const BrandIcon = () => (
    <svg viewBox="0 0 32 32" fill="none" className="logo-icon">
        <path d="M16 4L28 10V22L16 28L4 22V10L16 4Z" fill="url(#brand-grad-reg)" />
        <path d="M16 12L22 15V21L16 24L10 21V15L16 12Z" fill="white" fillOpacity="0.9" />
        <defs>
            <linearGradient id="brand-grad-reg" x1="4" y1="4" x2="28" y2="28">
                <stop stopColor="#a855f7" />
                <stop offset="1" stopColor="#6366f1" />
            </linearGradient>
        </defs>
    </svg>
);

const CheckIcon = () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="20 6 9 17 4 12" />
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
        if (username.length < 3) return 'Username must be at least 3 characters';
        if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Username can only contain letters, numbers, and underscores';
        if (password.length < 6) return 'Password must be at least 6 characters';
        if (password !== confirmPassword) return 'Passwords do not match';
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
        setTimeout(() => {
            router.push(`/login?email=${encodeURIComponent(email)}`);
        }, 4000);
    };

    return (
        <div className="auth-container">
            {/* Aurora Background */}
            <div className="aurora-bg">
                <div className="aurora-orb orb-1" />
                <div className="aurora-orb orb-2" />
            </div>

            <div className="auth-wrapper">
                <div className="auth-card">
                    {/* Logo */}
                    <div className="auth-logo">
                        <BrandIcon />
                        <span className="logo-text">Andcord</span>
                    </div>

                    {success ? (
                        <div className="auth-success">
                            <div className="success-icon">
                                <CheckIcon />
                            </div>
                            <h2>Check your email</h2>
                            <p>
                                We&apos;ve sent a verification link to<br />
                                <strong>{email}</strong>
                            </p>
                            <p className="redirect-text">Redirecting to login...</p>
                        </div>
                    ) : (
                        <>
                            {/* Header */}
                            <div className="auth-header">
                                <h1>Create your account</h1>
                                <p>Join Andcord and connect with friends</p>
                            </div>

                            {/* Form */}
                            <form className="auth-form" onSubmit={handleSubmit}>
                                {error && <div className="auth-error">{error}</div>}

                                <div className="form-group">
                                    <label className="form-label" htmlFor="username">Username</label>
                                    <input
                                        id="username"
                                        type="text"
                                        className="form-input"
                                        placeholder="Choose a username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value.toLowerCase())}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label" htmlFor="email">Email</label>
                                    <input
                                        id="email"
                                        type="email"
                                        className="form-input"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label" htmlFor="password">Password</label>
                                    <div className="input-wrapper">
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            className="form-input"
                                            placeholder="Create a password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="input-toggle"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? 'Hide' : 'Show'}
                                        </button>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
                                    <input
                                        id="confirmPassword"
                                        type={showPassword ? 'text' : 'password'}
                                        className="form-input"
                                        placeholder="Confirm your password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>

                                <button type="submit" className="auth-button" disabled={loading}>
                                    {loading ? 'Creating account...' : 'Create Account'}
                                </button>
                            </form>

                            {/* Footer */}
                            <div className="auth-footer">
                                <p>Already have an account? <Link href="/login">Sign in</Link></p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
