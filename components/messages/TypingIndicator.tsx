'use client';

import './messages.css';

export default function TypingIndicator({ userName }: { userName?: string }) {
    return (
        <div className="typing-indicator">
            <div className="typing-dots">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
            </div>
            {userName && <span className="typing-text">{userName} is typing...</span>}
        </div>
    );
}
