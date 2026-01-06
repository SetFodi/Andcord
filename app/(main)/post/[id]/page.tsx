'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import PostCard from '@/components/feed/PostCard';
import type { Post } from '@/types/database';

export default function PostPage() {
    const params = useParams();
    const router = useRouter();
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const supabase = createClient();

    useEffect(() => {
        const fetchPost = async () => {
            if (!params.id) return;

            try {
                const { data, error } = await supabase
                    .from('posts')
                    .select(`
                        *,
                        author:profiles(*),
                        likes(user_id),
                        comments(
                            *,
                            author:profiles(*)
                        )
                    `)
                    .eq('id', params.id)
                    .single();

                if (error) throw error;

                // Transform data to match Post type
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const rawData = data as any;

                const transformedPost: Post = {
                    ...rawData,
                    likes_count: rawData.likes?.length || 0,
                    is_liked: false, // We'll set this if we have the user's session
                };

                // Check if current user liked the post
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    transformedPost.is_liked = rawData.likes?.some((like: any) => like.user_id === session.user.id);
                }

                setPost(transformedPost);
            } catch (err: unknown) {
                console.error('Error fetching post:', err);
                setError('Post not found');
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [params.id, supabase]);

    if (loading) {
        return (
            <div className="flex justify-center p-xl">
                <div className="spinner"></div>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="flex flex-col items-center justify-center p-xl text-center">
                <h2 className="text-xl font-bold mb-md">Post not found</h2>
                <p className="text-secondary mb-lg">The post you are looking for does not exist or has been deleted.</p>
                <button onClick={() => router.back()} className="btn btn-primary">
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="page-content" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <header className="page-header mb-lg">
                <button onClick={() => router.back()} className="btn btn-ghost btn-sm mb-sm text-secondary">
                    ← Back
                </button>
                <h1 className="page-title">Post</h1>
            </header>

            <PostCard
                post={post}
                onUpdate={() => {
                    // If deleted, go back
                    router.back();
                }}
            />
        </div>
    );
}
