'use client';

import { usePresence, OnlineStatus } from '@/lib/hooks/usePresence';
import './OnlineIndicator.css';

interface OnlineIndicatorProps {
    userId: string;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
}

export default function OnlineIndicator({
    userId,
    size = 'sm',
    showLabel = false
}: OnlineIndicatorProps) {
    const { getStatus } = usePresence();
    const status = getStatus(userId);

    const statusLabels: Record<OnlineStatus, string> = {
        online: 'Online',
        away: 'Away',
        offline: 'Offline',
    };

    return (
        <div className={`online-indicator online-indicator-${size}`}>
            <span className={`status-dot status-${status}`} />
            {showLabel && (
                <span className="status-label">{statusLabels[status]}</span>
            )}
        </div>
    );
}
