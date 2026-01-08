'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import AndromedaLoader from '@/components/ui/AndromedaLoader';
import '../auth.css';

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
            {/* Background Layers */}
            <div className="starfield" />
            <div className="perspective-grid-container">
                <div className="perspective-grid" />
                <div className="grid-fade" />
            </div>
            <div className="cosmic-elements">
                <div className="planet-main">
                    <div className="planet-ring" />
                </div>
                <div className="purple-nebula" />
                <div className="shooting-star" />
                <div className="shooting-star" />
            </div>

            <div className="auth-wrapper">
                <div className="auth-card-glass">
                    {/* Left Panel - Branding */}
                    <div className="auth-branding">
                        <div className="branding-content">
                            <div className="logo-wrapper">
                                <span className="logo-icon">✦</span>
                                <span className="logo-text">Andcord</span>
                            </div>
                            <div className="branding-hero">
                                <h1>
                                    Welcome back,
                                    <br />
                                    <span className="text-gradient">Space Cowboy.</span>
                                </h1>
                                <p>
                                    Your crew is waiting. Reconnect with your community across the galaxy.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Form */}
                    <div className="auth-form-panel">
                        <div className="auth-header">
                            <h2>Log In</h2>
                            <p>
                                New here? <Link href="/register">Create an account</Link>
                            </p>
                        </div>

                        <form className="auth-form" onSubmit={handleSubmit}>
                            {error && <div className="auth-error">{error}</div>}

                            <div className="form-group">
                                <label className="form-label" htmlFor="email">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    className="form-input"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="password">Password</label>
                                <div className="password-wrapper" style={{ position: 'relative' }}>
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
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: '12px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            color: 'rgba(255,255,255,0.4)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {showPassword ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                            </div>

                            <button type="submit" className="auth-button" disabled={loading}>
                                {loading ? 'Signing in...' : 'Sign In'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<AndromedaLoader message="Loading..." />}>
            <LoginForm />
        </Suspense>
    );
}
