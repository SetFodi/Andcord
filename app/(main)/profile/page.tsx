'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { uploadFile, validateFile } from '@/lib/utils/uploadFile';
import './profile.css';

export default function ProfilePage() {
    const { profile, updateProfile } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [displayName, setDisplayName] = useState(profile?.display_name || '');
    const [bio, setBio] = useState(profile?.bio || '');
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadingBanner, setUploadingBanner] = useState(false);
    const [error, setError] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleBannerClick = () => {
        bannerInputRef.current?.click();
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validation = validateFile(file, 'image');
        if (!validation.valid) {
            setError(validation.error || 'Invalid file');
            return;
        }

        setUploading(true);
        setError('');

        const { url, error: uploadError } = await uploadFile(file, 'avatars', profile?.id);

        if (uploadError || !url) {
            console.error('Upload failed:', uploadError);
            setError('Failed to upload image');
            setUploading(false);
            return;
        }

        const { error: updateError } = await updateProfile({ avatar_url: url });

        if (updateError) {
            setError('Failed to update profile');
        }

        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validation = validateFile(file, 'image');
        if (!validation.valid) {
            setError(validation.error || 'Invalid file');
            return;
        }

        setUploadingBanner(true);
        setError('');

        const { url, error: uploadError } = await uploadFile(file, 'banners', profile?.id);

        if (uploadError || !url) {
            console.error('Banner upload failed:', uploadError);
            setError('Failed to upload banner');
            setUploadingBanner(false);
            return;
        }

        const { error: updateError } = await updateProfile({ banner_url: url });

        if (updateError) {
            setError('Failed to update profile');
        }

        setUploadingBanner(false);
        if (bannerInputRef.current) bannerInputRef.current.value = '';
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');

        const { error } = await updateProfile({
            display_name: displayName.trim(),
            bio: bio.trim(),
        });

        if (error) {
            setError('Failed to save changes');
        } else {
            setIsEditing(false);
        }

        setSaving(false);
    };

    const handleCancel = () => {
        setDisplayName(profile?.display_name || '');
        setBio(profile?.bio || '');
        setIsEditing(false);
        setError('');
    };

    return (
        <>
            <header className="page-header">
                <h1 className="page-title">Profile</h1>
                {!isEditing ? (
                    <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>
                        Edit Profile
                    </button>
                ) : (
                    <div className="flex gap-sm">
                        <button className="btn btn-ghost" onClick={handleCancel} disabled={saving}>
                            Cancel
                        </button>
                        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                )}
            </header>

            {/* Cover Banner */}
            <button
                className={`profile-banner ${uploadingBanner ? 'uploading' : ''}`}
                onClick={handleBannerClick}
                disabled={uploadingBanner}
            >
                {profile?.banner_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={profile.banner_url}
                        alt="Cover"
                        className="banner-image"
                    />
                ) : (
                    <div className="banner-placeholder">
                        <span className="banner-icon">🖼️</span>
                        <span className="banner-text">Click to add cover photo</span>
                    </div>
                )}
                <div className="banner-overlay">
                    {uploadingBanner ? '⏳ Uploading...' : '📷 Change Cover'}
                </div>
                <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBannerChange}
                    className="hidden"
                />
            </button>

            <div className="page-content profile-content-container">
                <div className="profile-card">
                    {error && <div className="profile-error">{error}</div>}

                    {/* Avatar */}
                    <div className="profile-avatar-section">
                        <button
                            className={`profile-avatar ${uploading ? 'uploading' : ''}`}
                            onClick={handleAvatarClick}
                            disabled={uploading}
                        >
                            <div className="avatar avatar-2xl">
                                {profile?.avatar_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={profile.avatar_url} alt={profile.display_name || 'Avatar'} />
                                ) : (
                                    <span>{profile?.display_name?.[0]?.toUpperCase() || '?'}</span>
                                )}
                            </div>
                            <div className="avatar-overlay">
                                {uploading ? '⏳' : '📷'}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                className="hidden"
                            />
                        </button>
                        <p className="avatar-hint">Click to change (GIFs supported)</p>
                    </div>

                    {/* Profile Info */}
                    <div className="profile-info">
                        {isEditing ? (
                            <div className="input-group">
                                <label className="input-label">Display Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="Your display name"
                                    maxLength={50}
                                />
                            </div>
                        ) : (
                            <h2 className="profile-name">{profile?.display_name || 'Unknown'}</h2>
                        )}

                        <p className="profile-username">@{profile?.username}</p>

                        {isEditing ? (
                            <div className="input-group">
                                <label className="input-label">Bio</label>
                                <textarea
                                    className="input textarea"
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="Tell us about yourself..."
                                    maxLength={200}
                                    rows={3}
                                />
                                <span className="input-hint">{bio.length}/200</span>
                            </div>
                        ) : (
                            profile?.bio && <p className="profile-bio">{profile.bio}</p>
                        )}

                        <p className="profile-joined">
                            Joined {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', {
                                month: 'long',
                                year: 'numeric',
                            }) : 'Unknown'}
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
