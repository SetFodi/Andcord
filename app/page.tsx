"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import "./landing.css";

// Floating Orb Component - the "soul" of the page
function AuroraOrb() {
  return (
    <div className="aurora-container">
      <div className="aurora-orb orb-1" />
      <div className="aurora-orb orb-2" />
      <div className="aurora-orb orb-3" />
    </div>
  );
}

// Animated Message Preview
function LiveChat() {
  const messages = [
    { id: 1, user: "Maya", avatar: "M", text: "anyone down for raids tonight?", time: "now", self: false },
    { id: 2, user: "You", avatar: "Y", text: "count me in! 🎮", time: "now", self: true },
    { id: 3, user: "Alex", avatar: "A", text: "let's gooo", time: "now", self: false },
  ];

  return (
    <div className="live-chat-demo">
      <div className="chat-window">
        <div className="chat-header">
          <div className="chat-channel">
            <span className="channel-hash">#</span>
            <span>gaming-lounge</span>
          </div>
          <div className="chat-status">
            <span className="status-dot" />
            <span>24 online</span>
          </div>
        </div>
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div
              key={msg.id}
              className={`chat-message ${msg.self ? 'self' : ''}`}
              style={{ animationDelay: `${i * 0.15 + 0.5}s` }}
            >
              <div className="msg-avatar">{msg.avatar}</div>
              <div className="msg-content">
                <span className="msg-user">{msg.user}</span>
                <p className="msg-text">{msg.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="chat-input-demo">
          <span className="typing-indicator">
            <span />
            <span />
            <span />
          </span>
          <span className="typing-text">Someone is typing...</span>
        </div>
      </div>
    </div>
  );
}

// Feature Card with Magnetic Effect
function FeatureCard({
  icon,
  title,
  description,
  accent,
  delay = 0
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: string;
  delay?: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;

    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
    setGlowPos({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
  };

  const handleMouseLeave = () => {
    setTransform('');
  };

  return (
    <div
      ref={cardRef}
      className="feature-card"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform,
        animationDelay: `${delay}s`,
        '--accent': accent,
        '--glow-x': `${glowPos.x}%`,
        '--glow-y': `${glowPos.y}%`,
      } as React.CSSProperties}
    >
      <div className="card-glow" />
      <div className="card-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}


export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="landing-page">
      <AuroraOrb />

      {/* Navigation */}
      <nav className={`nav-glass ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-inner">
          <Link href="/" className="nav-brand">
            <div className="brand-icon">
              <svg viewBox="0 0 32 32" fill="none">
                <path d="M16 4L28 10V22L16 28L4 22V10L16 4Z" fill="url(#brand-grad)" />
                <path d="M16 12L22 15V21L16 24L10 21V15L16 12Z" fill="white" fillOpacity="0.9" />
                <defs>
                  <linearGradient id="brand-grad" x1="4" y1="4" x2="28" y2="28">
                    <stop stopColor="#a855f7" />
                    <stop offset="1" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="brand-text">Andcord</span>
          </Link>

          <div className="nav-center">
            <a href="#features" className="nav-link">Features</a>
            <a href="#community" className="nav-link">Community</a>
          </div>

          <div className="nav-actions">
            <Link href="/login" className="btn-text">Sign In</Link>
            <Link href="/register" className="btn-primary">
              Get Started
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-pulse" />
            <span>Now with HD Voice & Video</span>
          </div>

          <h1 className="hero-title">
            Your Place to
            <span className="title-highlight">
              <span className="highlight-text">Connect</span>
              <svg className="highlight-underline" viewBox="0 0 200 12" preserveAspectRatio="none">
                <path d="M0 9C50 9 50 3 100 3C150 3 150 9 200 9" stroke="url(#underline-grad)" strokeWidth="4" fill="none" strokeLinecap="round" />
                <defs>
                  <linearGradient id="underline-grad" x1="0" y1="0" x2="200" y2="0">
                    <stop stopColor="#a855f7" />
                    <stop offset="1" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
          </h1>

          <p className="hero-subtitle">
            Build communities, share moments, and stay close with friends.
            Voice, video, and text — reimagined for the way you live.
          </p>

          <div className="hero-cta">
            <Link href="/register" className="cta-main">
              <span>Start Your Community</span>
              <div className="cta-shine" />
            </Link>
            <Link href="/login" className="cta-secondary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>Watch Demo</span>
            </Link>
          </div>

        </div>

        <div className="hero-visual">
          <LiveChat />
          <div className="visual-decoration dec-1" />
          <div className="visual-decoration dec-2" />
        </div>
      </section>

      {/* Features Section */}
      <section className="features" id="features">
        <div className="section-header">
          <span className="section-tag">Features</span>
          <h2>Everything you need,<br /><span className="text-gradient">nothing you don&apos;t</span></h2>
        </div>

        <div className="features-grid">
          <FeatureCard
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 18.5C15.5899 18.5 18.5 15.5899 18.5 12C18.5 8.41015 15.5899 5.5 12 5.5C8.41015 5.5 5.5 8.41015 5.5 12C5.5 15.5899 8.41015 18.5 12 18.5Z" />
                <path d="M12 8V12L14.5 14.5" />
                <path d="M12 2V4" /><path d="M12 20V22" />
                <path d="M4 12H2" /><path d="M22 12H20" />
              </svg>
            }
            title="Real-Time Everything"
            description="Messages arrive instantly. Voice is crystal clear. Video is smooth. No lag, no waiting."
            accent="#a855f7"
            delay={0}
          />
          <FeatureCard
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 21V19C17 16.7909 15.2091 15 13 15H5C2.79086 15 1 16.7909 1 19V21" />
                <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" />
                <path d="M23 21V19C22.9986 17.1771 21.765 15.5857 20 15.13" />
                <path d="M16 3.13C17.7699 3.58317 19.0078 5.17799 19.0078 7.005C19.0078 8.83201 17.7699 10.4268 16 10.88" />
              </svg>
            }
            title="Unlimited Communities"
            description="Create spaces for gaming, learning, creating, or just hanging out. No limits."
            accent="#06b6d4"
            delay={0.1}
          />
          <FeatureCard
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
                <path d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14" />
                <path d="M9 9H9.01" /><path d="M15 9H15.01" />
              </svg>
            }
            title="Rich Reactions"
            description="Express yourself with custom emojis, GIFs, stickers, and reactions."
            accent="#f59e0b"
            delay={0.2}
          />
          <FeatureCard
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 22S20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" />
                <path d="M9 12L11 14L15 10" />
              </svg>
            }
            title="Private & Secure"
            description="Your conversations stay yours. End-to-end encryption for peace of mind."
            accent="#22c55e"
            delay={0.3}
          />
        </div>
      </section>

      {/* Community Section */}
      <section className="community-section" id="community">
        <div className="community-content">
          <span className="section-tag">Community</span>
          <h2>Your space,<br />your people</h2>
          <p>Create private spaces for your friend groups. Chat, share, and stay connected with the people who matter most.</p>

          <Link href="/register" className="btn-primary large">
            Start Your Group
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="community-visual">
          <div className="floating-cards">
            {['Gaming', 'Music', 'Art', 'Tech', 'Sports'].map((cat, i) => (
              <div
                key={cat}
                className="floating-card"
                style={{
                  animationDelay: `${i * 0.2}s`,
                  '--index': i
                } as React.CSSProperties}
              >
                <span className="card-emoji">
                  {['🎮', '🎵', '🎨', '💻', '⚽'][i]}
                </span>
                <span className="card-label">{cat}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-bg" />
        <div className="cta-content">
          <h2>Ready to dive in?</h2>
          <p>Create your account and start connecting with your friends today.</p>
          <Link href="/register" className="cta-main white">
            <span>Create Your Account</span>
            <div className="cta-shine" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="brand-icon small">
              <svg viewBox="0 0 32 32" fill="none">
                <path d="M16 4L28 10V22L16 28L4 22V10L16 4Z" fill="url(#footer-grad)" />
                <path d="M16 12L22 15V21L16 24L10 21V15L16 12Z" fill="white" fillOpacity="0.9" />
                <defs>
                  <linearGradient id="footer-grad" x1="4" y1="4" x2="28" y2="28">
                    <stop stopColor="#a855f7" />
                    <stop offset="1" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span>Andcord</span>
          </div>

          <div className="footer-links">
            <a href="#">About</a>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Support</a>
          </div>

          <div className="footer-copy">
            <span>© 2026 Andcord. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
