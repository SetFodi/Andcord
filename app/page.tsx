"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import "./landing.css";

// 3D Card Component for "Spotlight" effect
function SpotlightCard({
  children,
  className = "",
  size = "normal"
}: {
  children: React.ReactNode;
  className?: string;
  size?: "normal" | "wide" | "tall" | "large";
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;

    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => setOpacity(1);
  const handleMouseLeave = () => setOpacity(0);

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`spotlight-card ${size} ${className}`}
    >
      <div
        className="spotlight-overlay"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(168, 85, 247, 0.15), transparent 40%)`,
        }}
      />
      <div className="card-content">{children}</div>
    </div>
  );
}

// Mock Interface Component
function AppMockup() {
  return (
    <div className="app-mockup">
      <div className="mockup-sidebar">
        <div className="mockup-server active" />
        <div className="mockup-server" />
        <div className="mockup-server" />
      </div>
      <div className="mockup-channel-list">
        <div className="mockup-header-sm" />
        <div className="mockup-channel active" />
        <div className="mockup-channel" />
        <div className="mockup-channel" />
      </div>
      <div className="mockup-chat">
        <div className="mockup-header-lg" />
        <div className="mockup-messages">
          <div className="mockup-msg msg-1" />
          <div className="mockup-msg msg-2" />
          <div className="mockup-msg msg-3 self" />
        </div>
        <div className="mockup-input" />
      </div>
    </div>
  );
}

// Icons
const MessageIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
  </svg>
);

const BoltIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

const GlobeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* Background Grid */}
      <div className="perspective-grid-container">
        <div className="perspective-grid" />
        <div className="grid-fade" />
      </div>

      {/* Navigation */}
      <nav className="glass-nav">
        <div className="nav-content">
          <div className="nav-logo">
            <span className="logo-spark">✦</span>
            <span className="logo-text">Andcord</span>
          </div>
          <div className="nav-links">
            <Link href="/login" className="nav-item">Log In</Link>
            <Link href="/register" className="nav-btn-primary">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-text">
            <div className="pill-badge">
              <span className="pill-dot" />
              <span>v2.0 is now live</span>
            </div>
            <h1 className="hero-headline">
              Where the world
              <br />
              <span className="text-gradient">hangs out</span>
            </h1>
            <p className="hero-sub">
              Experience the next generation of community.
              Crystal clear voice, zero-latency video, and chat that actually works.
            </p>
            <div className="hero-actions">
              <Link href="/register" className="btn-glow">
                Start for free
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <Link href="/login" className="btn-ghost">
                Open in browser
              </Link>
            </div>

            {/* Social Proof */}
            <div className="social-proof">
              <div className="avatars">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="avatar-stack" style={{ zIndex: 4 - i }} />
                ))}
              </div>
              <p>Trusted by 10,000+ communities</p>
            </div>
          </div>

          <div className="hero-visual-3d">
            <div className="floating-card main-interface">
              <AppMockup />
            </div>
            <div className="floating-card glass-panel-1" />
            <div className="floating-card glass-panel-2" />
          </div>
        </div>
      </section>

      {/* Features Grid (Bento Box) */}
      <section className="features-section">
        <div className="section-header">
          <h2>Built for <span className="text-white">everyone</span></h2>
          <p>Whether you're a gaming, education, or art community, we have the tools you need.</p>
        </div>

        <div className="bento-grid">
          {/* Main Feature - Wide */}
          <SpotlightCard size="wide" className="feature-chat">
            <div className="feature-badge"><MessageIcon /></div>
            <h3>Real-time Chat Reimagined</h3>
            <p>Threads, replies, and reactions that feel instant. No more loading spinners.</p>
            <div className="mock-chat-bubble-container">
              <div className="mock-bubble left">Hey! Did you see the update?</div>
              <div className="mock-bubble right">Yeah, it looks insane! 🚀</div>
            </div>
          </SpotlightCard>

          {/* Feature - Tall */}
          <SpotlightCard size="tall" className="feature-voice">
            <div className="feature-badge"><BoltIcon /></div>
            <h3>Low Latency<br />Voice</h3>
            <p>Talk as if you're in the same room. Noise suppression included.</p>
            <div className="visual-equalizer">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="eq-bar" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          </SpotlightCard>

          {/* Feature - Normal */}
          <SpotlightCard size="normal" className="feature-global">
            <div className="feature-badge"><GlobeIcon /></div>
            <h3>Global Servers</h3>
            <p>Connect from anywhere with our edge network.</p>
          </SpotlightCard>

          {/* Feature - Normal */}
          <SpotlightCard size="normal" className="feature-secure">
            <div className="feature-badge"><ShieldIcon /></div>
            <h3>Private & Secure</h3>
            <p>Your data stays yours. End-to-end encryption.</p>
          </SpotlightCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-minimal">
        <div className="footer-content">
          <div className="footer-logo">
            <span className="logo-text-muted">Andcord</span>
            <span className="copyright">© 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
