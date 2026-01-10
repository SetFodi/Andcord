"use client";

import "./andromeda-loader.css";

export default function AndromedaLoader() {
    return (
        <div className="andromeda-loader">
            {/* Aurora Background */}
            <div className="loader-aurora">
                <div className="aurora-blob blob-1" />
                <div className="aurora-blob blob-2" />
            </div>

            {/* Main Logo Animation */}
            <div className="loader-logo">
                <svg viewBox="0 0 64 64" className="logo-svg">
                    {/* Outer hexagon */}
                    <path
                        className="hex-outer"
                        d="M32 4L56 18V46L32 60L8 46V18L32 4Z"
                        fill="none"
                        stroke="url(#loader-grad)"
                        strokeWidth="1.5"
                    />
                    {/* Inner hexagon */}
                    <path
                        className="hex-inner"
                        d="M32 20L44 27V41L32 48L20 41V27L32 20Z"
                        fill="url(#loader-grad)"
                    />
                    {/* Gradient definition */}
                    <defs>
                        <linearGradient id="loader-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#a855f7" />
                            <stop offset="100%" stopColor="#6366f1" />
                        </linearGradient>
                    </defs>
                </svg>

                {/* Orbit rings */}
                <div className="orbit orbit-1">
                    <div className="orbit-dot" />
                </div>
                <div className="orbit orbit-2">
                    <div className="orbit-dot" />
                </div>
            </div>

            {/* Brand */}
            <div className="loader-brand">
                <span className="brand-name">Andcord</span>
                <div className="brand-line">
                    <div className="line-progress" />
                </div>
            </div>
        </div>
    );
}
