'use client';

import { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Global error:', error);
    }, [error]);

    return (
        <html>
            <body>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    padding: '2rem',
                    backgroundColor: '#0c0a14',
                    color: '#fff',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                }}>
                    <div style={{ textAlign: 'center', maxWidth: '400px' }}>
                        <svg
                            width="64"
                            height="64"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#ef4444"
                            strokeWidth="1.5"
                            style={{ marginBottom: '1.5rem' }}
                        >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                            Something went wrong
                        </h2>
                        <p style={{ color: '#a1a1aa', marginBottom: '1.5rem' }}>
                            An unexpected error occurred. Please try again.
                        </p>
                        <button
                            onClick={reset}
                            style={{
                                padding: '0.75rem 1.5rem',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                color: '#fff',
                                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                                border: 'none',
                                borderRadius: '0.5rem',
                                cursor: 'pointer'
                            }}
                        >
                            Try again
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
