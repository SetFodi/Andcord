'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import AndromedaLoader from '@/components/ui/AndromedaLoader';
import '../auth.css';

const BrandIcon = () => (
    <svg viewBox="0 0 32 32" fill="none" className="logo-icon">
        <path d="M16 4L28 10V22L16 28L4 22V10L16 4Z" fill="url(#brand-grad)" />
        <path d="M16 12L22 15V21L16 24L10 21V15L16 12Z" fill="white" fillOpacity="0.9" />
        <defs>
            <linearGradient id="brand-grad" x1="4" y1="4" x2="28" y2="28">
                <stop stopColor="#a855f7" />
                <stop offset="1" stopColor="#6366f1" />
            </linearGradient>
        </defs>
    </svg>
);

function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { signIn } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const emailParam = searchParams.get('email');
        if (emailParam) {
            setEmail(emailParam);
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { error: signInError } = await signIn(email, password);

        if (signInError) {
            setError(signInError.message);
            setLoading(false);
            return;
        }

        router.push('/feed');
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

                    {/* Header */}
                    <div className="auth-header">
                        <h1>Welcome back</h1>
                        <p>Sign in to continue to Andcord</p>
                    </div>

                    {/* Form */}
                    <form className="auth-form" onSubmit={handleSubmit}>
                        {error && <div className="auth-error">{error}</div>}

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
                                    placeholder="Enter your password"
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

                        <button type="submit" className="auth-button" disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="auth-footer">
                        <p>Don&apos;t have an account? <Link href="/register">Create one</Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<AndromedaLoader />}>
            <LoginForm />
        </Suspense>
    );
}
