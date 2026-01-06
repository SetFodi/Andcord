'use client';

import Link from 'next/link';
import './not-found.css';

export default function NotFound() {
    return (
        <div className="not-found-wrapper">
            <div className="stars">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="star"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            width: `${Math.random() * 3}px`,
                            height: `${Math.random() * 3}px`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${3 + Math.random() * 4}s`
                        }}
                    />
                ))}
            </div>

            <div className="not-found-content">
                <div className="error-code">404</div>
                <h1 className="error-title">Lost in Orbit?</h1>
                <p className="error-message">
                    Even space has dead ends. The signal you&apos;re looking for seems to have vanished into the void.
                </p>
                <Link href="/feed" className="home-link">
                    <span>Return to Network</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m12 19-7-7 7-7" />
                        <path d="M19 12H5" />
                    </svg>
                </Link>
            </div>
        </div>
    );
}
