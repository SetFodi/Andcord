'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import './contact.css';

const BugIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m8 2 1.88 1.88" />
        <path d="M14.12 3.88 16 2" />
        <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" />
        <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" />
        <path d="M12 20v-9" />
        <path d="M6.53 9C4.6 8.8 3 7.1 3 5" />
        <path d="M6 13H2" />
        <path d="M3 21c0-2.1 1.7-3.9 3.8-4" />
        <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4" />
        <path d="M18 13h4" />
        <path d="M17.2 17c2.1.1 3.8 1.9 3.8 4" />
    </svg>
);

const CheckIcon = () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" />
    </svg>
);

export default function ContactPage() {
    const { profile } = useAuth();
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [formData, setFormData] = useState({
        name: profile?.display_name || '',
        email: '',
        subject: 'bug_report',
        message: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');

        // Simulate API call
        // In a real app, you'd insert into Supabase contact_reports table here
        setTimeout(() => {
            setStatus('success');
        }, 1500);
    };

    if (status === 'success') {
        return (
            <div className="contact-container animate-fadeIn">
                <div className="contact-card success-state">
                    <div className="success-icon"><CheckIcon /></div>
                    <h2 className="empty-state-title">Message Received!</h2>
                    <p className="empty-state-description">
                        Thanks for reaching out, {formData.name}. We'll look into your report and get back to you at {formData.email} if needed.
                    </p>
                    <button className="btn btn-primary" onClick={() => setStatus('idle')}>
                        Send Another Message
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="contact-container animate-fadeIn">
            <header className="page-header">
                <h1 className="page-title">Contact & Support</h1>
                <p className="page-subtitle">Report a bug or share your feedback with us.</p>
            </header>

            <div className="contact-card">
                <div className="contact-header">
                    <div className="contact-icon-large"><BugIcon /></div>
                    <h3>Send a Report</h3>
                    <p className="card-description">We typically respond within 24 hours.</p>
                </div>

                <form className="contact-form" onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="name">Full Name</label>
                            <input
                                type="text"
                                id="name"
                                className="form-input"
                                placeholder="Your name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                className="form-input"
                                placeholder="your@email.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="subject">Subject</label>
                        <select
                            id="subject"
                            className="form-select"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        >
                            <option value="bug_report">Report a Bug</option>
                            <option value="feature_request">Feature Request</option>
                            <option value="account_issue">Account Issue</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="message">Message</label>
                        <textarea
                            id="message"
                            className="form-textarea"
                            placeholder="Tell us what's on your mind..."
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            required
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary submit-btn"
                        disabled={status === 'submitting'}
                    >
                        {status === 'submitting' ? 'Sending...' : 'Send Message'}
                    </button>
                </form>
            </div>
        </div>
    );
}
