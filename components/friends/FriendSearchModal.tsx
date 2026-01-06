'use client';

import { useState, useEffect } from 'react';
import type { Profile } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import './friend-search-modal.css';

interface FriendSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddFriend: (userId: string) => Promise<void>;
    isFriend: (userId: string) => boolean;
    hasPendingRequest: (userId: string) => boolean;
}

const SearchIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

const CloseIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const LoaderIcon = () => (
    <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="2" x2="12" y2="6" />
        <line x1="12" y1="18" x2="12" y2="22" />
        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
        <line x1="2" y1="12" x2="6" y2="12" />
        <line x1="18" y1="12" x2="22" y2="12" />
        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
    </svg>
);

export default function FriendSearchModal({
    isOpen,
    onClose,
    onAddFriend,
    isFriend,
    hasPendingRequest
}: FriendSearchModalProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Profile[]>([]);
    const [searching, setSearching] = useState(false);
    const { profile } = useAuth();
    const supabase = createClient();

    useEffect(() => {
        if (!isOpen) {
            setQuery('');
            setResults([]);
            return;
        }

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    useEffect(() => {
        const search = async () => {
            if (!query.trim() || !profile) {
                setResults([]);
                return;
            }

            setSearching(true);
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
                .neq('id', profile.id)
                .limit(8);

            setResults(data || []);
            setSearching(false);
        };

        const debounce = setTimeout(search, 300);
        return () => clearTimeout(debounce);
    }, [query, profile, supabase]);

    if (!isOpen) return null;

    return (
        <div className="search-modal-overlay animate-fadeIn" onClick={onClose}>
            <div className={`search-modal-content animate-scaleIn ${query ? 'expanded' : ''}`} onClick={e => e.stopPropagation()}>
                <header className="modal-header">
                    <div className="search-bar-modern">
                        <span className="search-icon-fixed">
                            {searching ? <LoaderIcon /> : <SearchIcon />}
                        </span>
                        <input
                            autoFocus
                            type="text"
                            className="modal-search-input"
                            placeholder="Type a name or @username..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <button className="modal-close-btn" onClick={onClose}>
                            <CloseIcon />
                        </button>
                    </div>
                </header>

                {query && (
                    <div className="modal-body custom-scrollbar animate-fadeIn">
                        {results.length > 0 ? (
                            <div className="modal-results-list">
                                {results.map((user) => (
                                    <div key={user.id} className="modal-result-item">
                                        <div className="avatar avatar-lg">
                                            {user.avatar_url ? (
                                                <img src={user.avatar_url} alt="" />
                                            ) : (
                                                <span>{user.display_name?.[0]?.toUpperCase() || '?'}</span>
                                            )}
                                        </div>
                                        <div className="result-info">
                                            <span className="result-name">{user.display_name}</span>
                                            <span className="result-handle">@{user.username}</span>
                                        </div>
                                        <div className="result-actions">
                                            {isFriend(user.id) ? (
                                                <span className="status-badge friend">Friend</span>
                                            ) : hasPendingRequest(user.id) ? (
                                                <span className="status-badge pending">Pending</span>
                                            ) : (
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => onAddFriend(user.id)}
                                                >
                                                    Add Friend
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : !searching && (
                            <div className="modal-empty-state">
                                <p>No users match your search</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
