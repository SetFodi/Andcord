'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { formatRelativeTime } from '@/lib/utils/formatDate';
import type { Post } from '@/types/database';
import './post-card.css';

interface PostCardProps {
    post: Post;
    onUpdate?: () => void;
}

export default function PostCard({ post, onUpdate }: PostCardProps) {
    const [isLiked, setIsLiked] = useState(post.is_liked || false);
    const [likesCount, setLikesCount] = useState(post.likes_count || 0);
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState(post.comments || []);
    const [loadingLike, setLoadingLike] = useState(false);
    const [loadingComment, setLoadingComment] = useState(false);

    const { profile } = useAuth();
    const supabase = createClient();

    const handleLike = async () => {
        if (!profile || loadingLike) return;

        setLoadingLike(true);
        const wasLiked = isLiked;

        // Optimistic update
        setIsLiked(!isLiked);
        setLikesCount(prev => wasLiked ? prev - 1 : prev + 1);

        try {
            if (wasLiked) {
                // Unlike
                await supabase
                    .from('likes')
                    .delete()
                    .eq('post_id', post.id)
                    .eq('user_id', profile.id);
            } else {
                // Like
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (supabase as any)
                    .from('likes')
                    .insert({
                        post_id: post.id,
                        user_id: profile.id,
                    });

                // Create notification for post author (if not self)
                if (post.author_id !== profile.id) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    await (supabase as any).from('notifications').insert({
                        user_id: post.author_id,
                        type: 'like',
                        data: {
                            post_id: post.id,
                            liker_id: profile.id,
                            liker_name: profile.display_name,
                        },
                    });
                }
            }
        } catch (error) {
            // Revert on error
            console.error('Error toggling like:', error);
            setIsLiked(wasLiked);
            setLikesCount(prev => wasLiked ? prev + 1 : prev - 1);
        } finally {
            setLoadingLike(false);
        }
    };

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile || !commentText.trim() || loadingComment) return;

        setLoadingComment(true);

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: newComment, error } = await (supabase as any)
                .from('comments')
                .insert({
                    post_id: post.id,
                    author_id: profile.id,
                    content: commentText.trim(),
                })
                .select('*, author:profiles(*)')
                .single();

            if (error) throw error;

            setComments([...comments, newComment]);
            setCommentText('');

            // Create notification for post author (if not self)
            if (post.author_id !== profile.id) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (supabase as any).from('notifications').insert({
                    user_id: post.author_id,
                    type: 'comment',
                    data: {
                        post_id: post.id,
                        commenter_id: profile.id,
                        commenter_name: profile.display_name,
                        comment_preview: commentText.trim().slice(0, 50),
                    },
                });
            }

            onUpdate?.();
        } catch (error) {
            console.error('Error adding comment:', error);
        } finally {
            setLoadingComment(false);
        }
    };

    const author = post.author;

    return (
        <article className="post-card animate-fadeInUp">
            {/* Post Header */}
            <header className="post-header">
                <Link href={`/profile/${author?.id}`} className="post-author">
                    <div className="avatar avatar-md">
                        {author?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={author.avatar_url} alt={author.display_name || 'Avatar'} />
                        ) : (
                            <span>{author?.display_name?.[0]?.toUpperCase() || '?'}</span>
                        )}
                    </div>
                    <div className="author-info">
                        <span className="author-name">{author?.display_name || 'Unknown'}</span>
                        <span className="post-time">@{author?.username} · {formatRelativeTime(post.created_at)}</span>
                    </div>
                </Link>
                <button className="btn btn-ghost btn-icon post-menu" title="More options">
                    ⋯
                </button>
            </header>

            {/* Post Content */}
            {post.content && (
                <div className="post-content">
                    <p>{post.content}</p>
                </div>
            )}

            {/* Post Media */}
            {post.media_urls && post.media_urls.length > 0 && (
                <div className={`post-media media-count-${Math.min(post.media_urls.length, 4)}`}>
                    {post.media_urls.slice(0, 4).map((url, index) => (
                        <div key={url} className="media-item">
                            {url.includes('.mp4') || url.includes('.webm') || url.includes('.mov') ? (
                                <video
                                    src={url}
                                    controls
                                    className="media-content"
                                    preload="metadata"
                                />
                            ) : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={url} alt={`Post media ${index + 1}`} className="media-content" />
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Link Preview */}
            {post.link_preview && (
                <a
                    href={post.link_preview.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-preview"
                >
                    {post.link_preview.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={post.link_preview.image} alt="" className="link-image" />
                    )}
                    <div className="link-info">
                        <span className="link-title">{post.link_preview.title}</span>
                        <span className="link-description">{post.link_preview.description}</span>
                        <span className="link-url">{new URL(post.link_preview.url).hostname}</span>
                    </div>
                </a>
            )}

            {/* Post Actions */}
            <div className="post-actions">
                <button
                    className={`action-btn ${isLiked ? 'liked' : ''}`}
                    onClick={handleLike}
                    disabled={loadingLike}
                >
                    <span className="action-icon">{isLiked ? '❤️' : '🤍'}</span>
                    <span className="action-count">{likesCount}</span>
                </button>
                <button
                    className={`action-btn ${showComments ? 'active' : ''}`}
                    onClick={() => setShowComments(!showComments)}
                >
                    <span className="action-icon">💬</span>
                    <span className="action-count">{comments.length}</span>
                </button>
                <button className="action-btn" title="Share">
                    <span className="action-icon">🔗</span>
                </button>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="comments-section animate-fadeIn">
                    {comments.length > 0 && (
                        <div className="comments-list">
                            {comments.map((comment) => (
                                <div key={comment.id} className="comment">
                                    <Link href={`/profile/${comment.author?.id}`} className="avatar avatar-sm">
                                        {comment.author?.avatar_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={comment.author.avatar_url} alt="" />
                                        ) : (
                                            <span>{comment.author?.display_name?.[0]?.toUpperCase() || '?'}</span>
                                        )}
                                    </Link>
                                    <div className="comment-body">
                                        <div className="comment-header">
                                            <Link href={`/profile/${comment.author?.id}`} className="comment-author">
                                                {comment.author?.display_name}
                                            </Link>
                                            <span className="comment-time">{formatRelativeTime(comment.created_at)}</span>
                                        </div>
                                        <p className="comment-text">{comment.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <form className="comment-form" onSubmit={handleComment}>
                        <div className="avatar avatar-sm">
                            {profile?.avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={profile.avatar_url} alt="" />
                            ) : (
                                <span>{profile?.display_name?.[0]?.toUpperCase() || '?'}</span>
                            )}
                        </div>
                        <input
                            type="text"
                            className="comment-input"
                            placeholder="Write a comment..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                        />
                        <button
                            type="submit"
                            className="btn btn-primary btn-sm"
                            disabled={!commentText.trim() || loadingComment}
                        >
                            {loadingComment ? '...' : 'Post'}
                        </button>
                    </form>
                </div>
            )}
        </article>
    );
}
