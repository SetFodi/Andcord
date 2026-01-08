"use client";

import "./andromeda-loader.css";

// Pre-defined star positions to avoid hydration mismatch
const STARS = [
    { left: 5, top: 12, delay: 0.2 },
    { left: 15, top: 78, delay: 1.8 },
    { left: 23, top: 45, delay: 0.9 },
    { left: 32, top: 8, delay: 2.4 },
    { left: 41, top: 92, delay: 1.1 },
    { left: 48, top: 34, delay: 3.2 },
    { left: 56, top: 67, delay: 0.5 },
    { left: 64, top: 21, delay: 2.8 },
    { left: 72, top: 88, delay: 1.5 },
    { left: 79, top: 53, delay: 0.3 },
    { left: 87, top: 15, delay: 2.1 },
    { left: 94, top: 71, delay: 1.7 },
    { left: 8, top: 39, delay: 3.5 },
    { left: 28, top: 95, delay: 0.7 },
    { left: 45, top: 5, delay: 2.9 },
    { left: 62, top: 82, delay: 1.3 },
    { left: 83, top: 28, delay: 0.1 },
    { left: 91, top: 59, delay: 3.8 },
    { left: 12, top: 64, delay: 2.5 },
    { left: 38, top: 18, delay: 1.9 },
];

export default function AndromedaLoader() {
    return (
        <div className="andromeda-loader">
            {/* Subtle stars */}
            <div className="starfield">
                {STARS.map((star, i) => (
                    <div
                        key={i}
                        className="star"
                        style={{
                            left: `${star.left}%`,
                            top: `${star.top}%`,
                            animationDelay: `${star.delay}s`,
                        }}
                    />
                ))}
            </div>

            {/* Main loader */}
            <div className="loader-orb">
                <div className="orb-ring ring-1" />
                <div className="orb-ring ring-2" />
                <div className="orb-ring ring-3" />
                <div className="orb-core" />
            </div>

            {/* Brand text */}
            <div className="loader-text">
                <span className="brand-name">Andcord</span>
                <div className="loading-dots">
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                </div>
            </div>
        </div>
    );
}
