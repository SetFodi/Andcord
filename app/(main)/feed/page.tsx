'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import PostComposer from '@/components/feed/PostComposer';
import PostCard from '@/components/feed/PostCard';
import type { Post } from '@/types/database';
import './feed.css';

const POSTS_PER_PAGE = 10;

export default function FeedPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    const { profile } = useAuth();
    const supabase = createClient();

    const fetchPosts = useCallback(async (offset = 0) => {
        if (!profile) return [];

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

        // Check if user has liked each post
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const postIds = (data as any[]).map(p => p.id);
        const { data: userLikes } = await supabase
            .from('likes')
            .select('post_id')
            .eq('user_id', profile.id)
            .in('post_id', postIds);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const likedPostIds = new Set((userLikes as any[] || []).map(l => l.post_id));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data as any[]).map(post => ({
            ...post,
            likes_count: post.likes?.[0]?.count || 0,
            is_liked: likedPostIds.has(post.id),
        }));
    }, [profile, supabase]);

    // Initial load
    useEffect(() => {
        const loadInitialPosts = async () => {
            setLoading(true);
            const initialPosts = await fetchPosts(0);
            setPosts(initialPosts);
            setHasMore(initialPosts.length === POSTS_PER_PAGE);
            setLoading(false);
        };

        if (profile) {
            loadInitialPosts();
        }

        // Timeout fallback - if no profile after 6 seconds, stop loading
        const timeout = setTimeout(() => {
            if (loading && !profile) {
                console.log('Feed: No profile after timeout, stopping loading');
                setLoading(false);
            }
        }, 6000);

        return () => clearTimeout(timeout);
    }, [fetchPosts, profile]);

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
                <h1 className="page-title">Feed</h1>
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
                            <>
                                {posts.map((post, index) => (
                                    <div
                                        key={post.id}
                                        className="post-wrapper"
                                        style={{ animationDelay: `${Math.min(index * 50, 250)}ms` }}
                                    >
                                        <PostCard post={post} onUpdate={handlePostUpdate} />
                                    </div>
                                ))}

                                {/* Load more trigger */}
                                <div ref={loadMoreRef} className="load-more-trigger">
                                    {loadingMore && (
                                        <div className="loading-spinner">
                                            <div className="spinner" />
                                        </div>
                                    )}
                                    {!hasMore && posts.length > 0 && (
                                        <p className="end-of-feed">You&apos;ve reached the end!</p>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
