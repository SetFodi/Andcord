'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { formatRelativeTime } from '@/lib/utils/formatDate';
import type { Post } from '@/types/database';
import './post-card.css';

// SVG Icons
const HeartIcon = ({ filled }: { filled?: boolean }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
);

const CommentIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);

const ShareIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
);

const MoreIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
        <circle cx="5" cy="12" r="1" />
    </svg>
);

const EditIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

const TrashIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);

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

    // Menu & Edit State
    const [showMenu, setShowMenu] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content || '');
    const [loadingDelete, setLoadingDelete] = useState(false);
    const [loadingEdit, setLoadingEdit] = useState(false);

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

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this post?')) return;
        setLoadingDelete(true);
        setShowMenu(false);

        try {
            await supabase.from('posts').delete().eq('id', post.id);
            onUpdate?.(); // Trigger refresh
        } catch (error) {
            console.error('Error deleting post:', error);
        } finally {
            setLoadingDelete(false);
        }
    };

    const handleUpdate = async () => {
        if (!editContent.trim()) return;
        setLoadingEdit(true);

        try {
            const { error } = await supabase
                .from('posts')
                .update({ content: editContent.trim() })
                .eq('id', post.id);

            if (error) throw error;
            setIsEditing(false);
            onUpdate?.();
        } catch (error) {
            console.error('Error updating post:', error);
        } finally {
            setLoadingEdit(false);
        }
    };

    const isAuthor = profile?.id === post.author_id;

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

                {isAuthor && (
                    <div className="post-menu-container" style={{ position: 'relative' }}>
                        <button
                            className="btn btn-ghost btn-icon post-menu"
                            title="More options"
                            onClick={() => setShowMenu(!showMenu)}
                        >
                            <MoreIcon />
                        </button>

                        {showMenu && (
                            <div className="menu-dropdown animate-fadeIn" style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-lg)',
                                padding: 'var(--space-xs)',
                                zIndex: 50,
                                minWidth: '150px',
                                boxShadow: 'var(--shadow-lg)'
                            }}>
                                <button
                                    className="menu-item"
                                    onClick={() => {
                                        setIsEditing(true);
                                        setShowMenu(false);
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-sm)',
                                        width: '100%',
                                        padding: 'var(--space-sm) var(--space-md)',
                                        border: 'none',
                                        background: 'transparent',
                                        color: 'var(--text-primary)',
                                        cursor: 'pointer',
                                        borderRadius: 'var(--radius-md)',
                                        textAlign: 'left',
                                        fontSize: 'var(--text-sm)'
                                    }}
                                >
                                    <EditIcon /> Edit Post
                                </button>
                                <button
                                    className="menu-item"
                                    onClick={handleDelete}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-sm)',
                                        width: '100%',
                                        padding: 'var(--space-sm) var(--space-md)',
                                        border: 'none',
                                        background: 'transparent',
                                        color: '#ef4444',
                                        cursor: 'pointer',
                                        borderRadius: 'var(--radius-md)',
                                        textAlign: 'left',
                                        fontSize: 'var(--text-sm)'
                                    }}
                                >
                                    {loadingDelete ? '...' : <><TrashIcon /> Delete Post</>}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </header>

            {/* Post Content */}
            {isEditing ? (
                <div className="post-edit-mode" style={{ padding: '0 var(--space-lg) var(--space-md)' }}>
                    <textarea
                        className="input"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        style={{ width: '100%', marginBottom: 'var(--space-sm)' }}
                    />
                    <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end' }}>
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                                setIsEditing(false);
                                setEditContent(post.content || '');
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={handleUpdate}
                            disabled={loadingEdit || !editContent.trim()}
                        >
                            {loadingEdit ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            ) : (
                post.content && (
                    <div className="post-content">
                        <p>{post.content}</p>
                    </div>
                )
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
                    <span className="action-icon"><HeartIcon filled={isLiked} /></span>
                    <span className="action-count">{likesCount}</span>
                </button>
                <button
                    className={`action-btn ${showComments ? 'active' : ''}`}
                    onClick={() => setShowComments(!showComments)}
                >
                    <span className="action-icon"><CommentIcon /></span>
                    <span className="action-count">{comments.length}</span>
                </button>
                <button className="action-btn" title="Share">
                    <span className="action-icon"><ShareIcon /></span>
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
