'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/database';
import './UserSearch.css';

const SearchIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

const CloseIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

export default function UserSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    // Search users
    useEffect(() => {
        const searchUsers = async () => {
            if (query.length < 2) {
                setResults([]);
                return;
            }

            setLoading(true);
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
                .limit(5);

            setResults(data || []);
            setLoading(false);
        };

        const debounce = setTimeout(searchUsers, 300);
        return () => clearTimeout(debounce);
    }, [query, supabase]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="user-search" ref={containerRef}>
            <div className={`search-input-wrapper ${isOpen ? 'focused' : ''}`}>
                <SearchIcon />
                <input
                    type="text"
                    placeholder="Search users..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    className="search-input"
                />
                {query && (
                    <button
                        className="clear-btn"
                        onClick={() => { setQuery(''); setResults([]); }}
                    >
                        <CloseIcon />
                    </button>
                )}
            </div>

            {isOpen && (query.length >= 2 || results.length > 0) && (
                <div className="search-dropdown">
                    {loading ? (
                        <div className="search-loading">Searching...</div>
                    ) : results.length === 0 ? (
                        <div className="search-empty">No users found</div>
                    ) : (
                        <div className="search-results">
                            {results.map((user) => (
                                <Link
                                    key={user.id}
                                    href={`/profile/${user.id}`}
                                    className="search-result-item"
                                    onClick={() => {
                                        setIsOpen(false);
                                        setQuery('');
                                    }}
                                >
                                    <div className="avatar avatar-sm">
                                        {user.avatar_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={user.avatar_url} alt={user.display_name || ''} />
                                        ) : (
                                            <span>{user.display_name?.[0]?.toUpperCase() || '?'}</span>
                                        )}
                                    </div>
                                    <div className="result-info">
                                        <span className="result-name">{user.display_name}</span>
                                        <span className="result-handle">@{user.username}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
