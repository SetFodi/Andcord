'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { validateFile, uploadMultipleFiles } from '@/lib/utils/uploadFile';
import './post-composer.css';

interface PostComposerProps {
    onPostCreated?: () => void;
}

export default function PostComposer({ onPostCreated }: PostComposerProps) {
    const [content, setContent] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { profile } = useAuth();
    const supabase = createClient();

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [content]);

    // Clean up preview URLs on unmount
    useEffect(() => {
        return () => {
            previews.forEach(url => URL.revokeObjectURL(url));
        };
    }, [previews]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        if (selectedFiles.length === 0) return;

        // Validate files
        const validFiles: File[] = [];
        const newPreviews: string[] = [];

        for (const file of selectedFiles) {
            const isVideo = file.type.startsWith('video/');
            const validation = validateFile(file, isVideo ? 'video' : 'image');

            if (!validation.valid) {
                setError(validation.error || 'Invalid file');
                continue;
            }

            // Limit total files
            if (files.length + validFiles.length >= 4) {
                setError('Maximum 4 files allowed');
                break;
            }

            validFiles.push(file);
            newPreviews.push(URL.createObjectURL(file));
        }

        setFiles([...files, ...validFiles]);
        setPreviews([...previews, ...newPreviews]);
        setError('');

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeFile = (index: number) => {
        URL.revokeObjectURL(previews[index]);
        setFiles(files.filter((_, i) => i !== index));
        setPreviews(previews.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!content.trim() && files.length === 0) {
            setError('Please add some content or media');
            return;
        }

        if (!profile) {
            setError('You must be logged in to post');
            return;
        }

        setLoading(true);
        setError('');

        try {
            let mediaUrls: string[] = [];

            // Upload files if any
            if (files.length > 0) {
                const { urls, errors } = await uploadMultipleFiles(files, 'posts', profile.id);

                if (errors.length > 0) {
                    throw new Error('Failed to upload some files');
                }

                mediaUrls = urls;
            }

            // Create post
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error: postError } = await (supabase as any)
                .from('posts')
                .insert({
                    author_id: profile.id,
                    content: content.trim() || null,
                    media_urls: mediaUrls.length > 0 ? mediaUrls : null,
                });

            if (postError) throw postError;

            // Reset form
            setContent('');
            setFiles([]);
            previews.forEach(url => URL.revokeObjectURL(url));
            setPreviews([]);
            setIsExpanded(false);

            onPostCreated?.();
        } catch (err) {
            console.error('Error creating post:', err);
            setError('Failed to create post. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`post-composer ${isExpanded ? 'expanded' : ''}`}>
            <form onSubmit={handleSubmit}>
                <div className="composer-header">
                    <div className="avatar avatar-md">
                        {profile?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={profile.avatar_url} alt={profile.display_name || 'Avatar'} />
                        ) : (
                            <span>{profile?.display_name?.[0]?.toUpperCase() || '?'}</span>
                        )}
                    </div>
                    <textarea
                        ref={textareaRef}
                        className="composer-input"
                        placeholder="What's on your mind?"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onFocus={() => setIsExpanded(true)}
                        rows={1}
                    />
                </div>

                {error && <div className="composer-error">{error}</div>}

                {/* File previews */}
                {previews.length > 0 && (
                    <div className="composer-previews">
                        {previews.map((preview, index) => (
                            <div key={preview} className="preview-item">
                                {files[index].type.startsWith('video/') ? (
                                    <video src={preview} className="preview-media" />
                                ) : (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={preview} alt="Preview" className="preview-media" />
                                )}
                                <button
                                    type="button"
                                    className="preview-remove"
                                    onClick={() => removeFile(index)}
                                    aria-label="Remove file"
                                >
                                    ✕
                                </button>
                                {files[index].type.startsWith('video/') && (
                                    <span className="preview-badge">Video</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Actions */}
                {isExpanded && (
                    <div className="composer-actions animate-fadeIn">
                        <div className="composer-tools">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,video/*"
                                multiple
                                onChange={handleFileSelect}
                                className="hidden"
                                id="file-input"
                            />
                            <label htmlFor="file-input" className="btn btn-ghost btn-icon tool-btn" title="Add photo or video">
                                📷
                            </label>
                            <button type="button" className="btn btn-ghost btn-icon tool-btn" title="Add emoji" disabled>
                                😊
                            </button>
                        </div>

                        <div className="composer-submit">
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => {
                                    setIsExpanded(false);
                                    setContent('');
                                    setFiles([]);
                                    previews.forEach(url => URL.revokeObjectURL(url));
                                    setPreviews([]);
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading || (!content.trim() && files.length === 0)}
                            >
                                {loading ? 'Posting...' : 'Post'}
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
}
