'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import '../auth.css';

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
        }, 5000);
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
                <div className="planet-main" style={{ top: 'auto', bottom: '-100px', right: 'auto', left: '-100px', background: 'radial-gradient(circle at 30% 30%, transparent 40%, rgba(0,0,0,0.8)), radial-gradient(circle at 70% 60%, #db2777 0%, transparent 60%), conic-gradient(from 0deg, #831843, #be185d, #831843)' }}>
                    <div className="planet-ring" style={{ width: '150%', height: '150%', transform: 'translate(-50%, -50%) rotateX(60deg) rotateY(-20deg)' }} />
                </div>
                <div className="purple-nebula" style={{ top: '-20%', right: '-10%', left: 'auto', background: 'radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, transparent 70%)' }} />
                <div className="shooting-star" style={{ top: '10%' }} />
                <div className="shooting-star" style={{ top: '40%', animationDelay: '2s' }} />
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
                                    Join the
                                    <br />
                                    <span className="text-gradient" style={{ backgroundImage: 'linear-gradient(135deg, #fff 0%, #ec4899 100%)' }}>Starfleet.</span>
                                </h1>
                                <p>
                                    Claim your coordinates in the verse. Build your base, find your squad.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Form */}
                    <div className="auth-form-panel">
                        {success ? (
                            <div className="auth-success" style={{ textAlign: 'center', width: '100%' }}>
                                <div className="auth-success-icon" style={{
                                    width: '80px', height: '80px', margin: '0 auto 24px',
                                    background: 'rgba(34,197,94,0.1)', color: '#22c55e',
                                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                                </div>
                                <h2>Signal Recieved!</h2>
                                <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '12px' }}>
                                    We've sent a verification link to <strong>{email}</strong>.
                                </p>
                                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginTop: '30px' }}>
                                    Warping to login...
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="auth-header">
                                    <h2>Sign Up</h2>
                                    <p>Already have an account? <Link href="/login">Log In</Link></p>
                                </div>

                                <form className="auth-form" onSubmit={handleSubmit}>
                                    {error && <div className="auth-error">{error}</div>}

                                    <div className="form-group">
                                        <label className="form-label" htmlFor="username">Username</label>
                                        <input
                                            id="username"
                                            type="text"
                                            className="form-input"
                                            placeholder="Choose a callsign"
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
                                                placeholder="Create a password"
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

                                    <div className="form-group">
                                        <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
                                        <input
                                            id="confirmPassword"
                                            type={showPassword ? 'text' : 'password'}
                                            className="form-input"
                                            placeholder="Confirm password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <button type="submit" className="auth-button" disabled={loading}>
                                        {loading ? 'Initializing...' : 'Join Andcord'}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
