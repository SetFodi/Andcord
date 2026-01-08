'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import PostComposer from '@/components/feed/PostComposer';
import PostCard from '@/components/feed/PostCard';
import UserSearch from '@/components/search/UserSearch';
import type { Post } from '@/types/database';
import './feed.css';

const POSTS_PER_PAGE = 10;

export default function FeedPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    const { user, profile } = useAuth();
    const supabase = createClient();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const fetchPosts = useCallback(async (offset = 0) => {
        // We can fetch posts even if we just have the user (for RLS/likes check)
        // If no user, RLS will return public posts anyway (or empty if protected)
        // But for our logic we prefer to wait for user to be robust
        if (!user) return [];

        console.log('📰 Fetching posts...');
        const { data, error } = await supabase
            .from('posts')
            .select(`
        *,
        author:profiles(*),
        likes:likes(count),
        comments:comments(
          *,
          author:profiles(*)
        )
      `)
            .order('created_at', { ascending: false })
            .range(offset, offset + POSTS_PER_PAGE - 1);

        if (error || !data) {
            console.error('Error fetching posts:', error);
            return [];
        }

        console.log(`✅ Fetched ${data.length} posts`);

        // Check if user has liked each post
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const postIds = (data as any[]).map(p => p.id);
        const { data: userLikes } = await supabase
            .from('likes')
            .select('post_id')
            .eq('user_id', user.id)
            .in('post_id', postIds);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const likedPostIds = new Set((userLikes as any[] || []).map(l => l.post_id));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data as any[]).map(post => ({
            ...post,
            likes_count: post.likes?.[0]?.count || 0,
            is_liked: likedPostIds.has(post.id),
        }));
    }, [user, supabase]);

    // Initial load
    useEffect(() => {
        const loadInitialPosts = async () => {
            // Try to load from cache first
            const cached = sessionStorage.getItem('feed-cache');
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    setPosts(parsed);
                    setLoading(false); // Show cached immediately
                    console.log('📦 Loaded posts from cache');
                } catch (e) {
                    console.error('Cache parse error', e);
                }
            } else {
                setLoading(true);
            }

            // Fetch fresh data
            const initialPosts = await fetchPosts(0);
            setPosts(initialPosts);
            setHasMore(initialPosts.length === POSTS_PER_PAGE);
            setLoading(false);

            // Update cache
            sessionStorage.setItem('feed-cache', JSON.stringify(initialPosts));
        };

        if (user) {
            loadInitialPosts();
        }

        // Timeout fallback - if no user after 6 seconds, stop loading
        const timeout = setTimeout(() => {
            if (loading && !user) {
                console.log('Feed: No user after timeout, stopping loading');
                setLoading(false);
            }
        }, 6000);

        return () => clearTimeout(timeout);
    }, [fetchPosts, user]);

    // Infinite scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            async (entries) => {
                if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
                    setLoadingMore(true);
                    const newPosts = await fetchPosts(posts.length);
                    setPosts(prev => [...prev, ...newPosts]);
                    setHasMore(newPosts.length === POSTS_PER_PAGE);
                    setLoadingMore(false);
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [fetchPosts, hasMore, loadingMore, loading, posts.length]);

    // Real-time subscription for new posts
    useEffect(() => {
        const channel = supabase
            .channel('posts-feed')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'posts' },
                async (payload) => {
                    // Fetch the full post with author
                    const { data: newPost } = await supabase
                        .from('posts')
                        .select(`
              *,
              author:profiles(*),
              likes:likes(count),
              comments:comments(*, author:profiles(*))
            `)
                        .eq('id', payload.new.id)
                        .single();

                    if (newPost) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const postData = newPost as any;
                        setPosts(prev => [{
                            ...postData,
                            likes_count: 0,
                            is_liked: false,
                        }, ...prev]);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    const handlePostCreated = () => {
        // Posts are added via real-time subscription
    };

    const handlePostUpdate = async () => {
        // Refresh posts on update (like/comment)
        const refreshedPosts = await fetchPosts(0);
        setPosts(refreshedPosts);
    };

    return (
        <>
            <header className="page-header">
                <h1 className="page-greeting">
                    <span className="greeting-text">{getGreeting()}, </span>
                    <span className="greeting-name">{profile?.display_name?.split(' ')[0] || 'Explorer'}</span>
                </h1>
                <UserSearch />
            </header>

            <div className="page-content">
                <div className="feed-container">
                    {/* Post Composer */}
                    <PostComposer onPostCreated={handlePostCreated} />

                    {/* Posts Feed */}
                    <div className="posts-feed">
                        {loading ? (
                            // Loading skeletons
                            <>
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="post-skeleton">
                                        <div className="skeleton-header">
                                            <div className="skeleton skeleton-avatar" />
                                            <div className="skeleton-info">
                                                <div className="skeleton skeleton-name" />
                                                <div className="skeleton skeleton-time" />
                                            </div>
                                        </div>
                                        <div className="skeleton skeleton-content" />
                                        <div className="skeleton skeleton-content short" />
                                    </div>
                                ))}
                            </>
                        ) : posts.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">📝</div>
                                <h3 className="empty-state-title">No posts yet</h3>
                                <p className="empty-state-description">
                                    Be the first to share something with your friends!
                                </p>
                            </div>
                        ) : (
                            <AnimatePresence>
                                {posts.map((post, index) => (
                                    <motion.div
                                        key={post.id}
                                        className="post-wrapper"
                                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                                        transition={{
                                            type: 'spring',
                                            stiffness: 300,
                                            damping: 25,
                                            delay: Math.min(index * 0.08, 0.4),
                                        }}
                                        whileHover={{ scale: 1.01 }}
                                    >
                                        <PostCard post={post} onUpdate={handlePostUpdate} />
                                    </motion.div>
                                ))}

                                {/* Load more trigger */}
                                <div ref={loadMoreRef} className="load-more-trigger">
                                    {loadingMore && (
                                        <motion.div
                                            className="loading-spinner"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                        >
                                            <div className="spinner" />
                                        </motion.div>
                                    )}
                                    {!hasMore && posts.length > 0 && (
                                        <p className="end-of-feed">You&apos;ve reached the end!</p>
                                    )}
                                </div>
                            </AnimatePresence>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
