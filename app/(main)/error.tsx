'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Application error:', error);
    }, [error]);

    return (
        <div className="error-boundary">
            <div className="error-content">
                <div className="error-icon">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                </div>
                <h2>Something went wrong</h2>
                <p>We encountered an unexpected error. Please try again.</p>
                <button onClick={reset} className="btn btn-primary">
                    Try again
                </button>
            </div>
            <style jsx>{`
                .error-boundary {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 60vh;
                    padding: 2rem;
                }
                .error-content {
                    text-align: center;
                    max-width: 400px;
                }
                .error-icon {
                    color: var(--error, #ef4444);
                    margin-bottom: 1.5rem;
                }
                h2 {
                    font-size: 1.5rem;
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                    color: var(--text-primary, #fff);
                }
                p {
                    color: var(--text-secondary, #a1a1aa);
                    margin-bottom: 1.5rem;
                }
            `}</style>
        </div>
    );
}
