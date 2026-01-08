'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { uploadFile, validateFile } from '@/lib/utils/uploadFile';
import ImageCropper from '@/components/cropper/ImageCropper';
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

    // Cropper state
    const [cropperImage, setCropperImage] = useState<string | null>(null);
    const [cropperType, setCropperType] = useState<'avatar' | 'banner'>('avatar');
    const [pendingFile, setPendingFile] = useState<File | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarClick = () => fileInputRef.current?.click();
    const handleBannerClick = () => bannerInputRef.current?.click();

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validation = validateFile(file, 'image');
        if (!validation.valid) {
            setError(validation.error || 'Invalid file');
            return;
        }

        // Show cropper
        const objectUrl = URL.createObjectURL(file);
        setCropperImage(objectUrl);
        setCropperType('avatar');
        setPendingFile(file);
    };

    const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validation = validateFile(file, 'image');
        if (!validation.valid) {
            setError(validation.error || 'Invalid file');
            return;
        }

        // Show cropper
        const objectUrl = URL.createObjectURL(file);
        setCropperImage(objectUrl);
        setCropperType('banner');
        setPendingFile(file);
    };

    const handleCropSave = async (position: { x: number; y: number }) => {
        if (!pendingFile) return;

        const isAvatar = cropperType === 'avatar';
        const setLoading = isAvatar ? setUploading : setUploadingBanner;
        const bucket = isAvatar ? 'avatars' : 'banners';

        setLoading(true);
        setError('');
        setCropperImage(null);

        const { url, error: uploadError } = await uploadFile(pendingFile, bucket, profile?.id);

        if (uploadError || !url) {
            console.error('Upload failed:', uploadError);
            setError(`Failed to upload ${isAvatar ? 'avatar' : 'banner'}`);
            setLoading(false);
            setPendingFile(null);
            return;
        }

        // Save URL and position
        const updateData = isAvatar
            ? { avatar_url: url, avatar_position: position }
            : { banner_url: url, banner_position: position };

        const { error: updateError } = await updateProfile(updateData);

        if (updateError) {
            setError('Failed to update profile');
        }

        setLoading(false);
        setPendingFile(null);

        // Reset input
        if (isAvatar && fileInputRef.current) fileInputRef.current.value = '';
        if (!isAvatar && bannerInputRef.current) bannerInputRef.current.value = '';
    };

    const handleCropCancel = () => {
        if (cropperImage) URL.revokeObjectURL(cropperImage);
        setCropperImage(null);
        setPendingFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
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

    // Get position styles
    const avatarPosition = profile?.avatar_position || { x: 50, y: 50 };
    const bannerPosition = profile?.banner_position || { x: 50, y: 50 };

    return (
        <div className="profile-page">
            <div className="profile-container">
                {/* Image Cropper Modal */}
                {cropperImage && (
                    <ImageCropper
                        imageUrl={cropperImage}
                        aspectRatio={cropperType === 'avatar' ? 'square' : 'banner'}
                        onSave={handleCropSave}
                        onCancel={handleCropCancel}
                    />
                )}

                {/* Cover Banner */}
                <div className="banner-wrapper">
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
                                style={{ objectPosition: `${bannerPosition.x}% ${bannerPosition.y}%` }}
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
                    </button>
                    <input
                        ref={bannerInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleBannerChange}
                        style={{ display: 'none' }}
                    />
                </div>

                {/* Profile Content */}
                <div className="profile-content">
                    {error && <div className="profile-error">{error}</div>}

                    {/* Avatar + Actions Header */}
                    <div className="profile-header">
                        <div className="avatar-wrapper">
                            <button
                                className={`profile-avatar ${uploading ? 'uploading' : ''}`}
                                onClick={handleAvatarClick}
                                disabled={uploading}
                            >
                                <div className="avatar avatar-2xl">
                                    {profile?.avatar_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={profile.avatar_url}
                                            alt={profile.display_name || 'Avatar'}
                                            style={{ objectPosition: `${avatarPosition.x}% ${avatarPosition.y}%` }}
                                        />
                                    ) : (
                                        <span>{profile?.display_name?.[0]?.toUpperCase() || '?'}</span>
                                    )}
                                </div>
                                <div className="avatar-overlay">
                                    {uploading ? '⏳' : '📷'}
                                </div>
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                style={{ display: 'none' }}
                            />
                        </div>

                        <div className="profile-actions">
                            {!isEditing ? (
                                <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(true)}>
                                    Edit Profile
                                </button>
                            ) : (
                                <div className="flex gap-sm">
                                    <button className="btn btn-ghost btn-sm" onClick={handleCancel} disabled={saving}>
                                        Cancel
                                    </button>
                                    <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                                        {saving ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Profile Info */}
                    <div className="profile-info-card">
                        {isEditing ? (
                            <div className="input-group">
                                <label className="input-label">Display Name</label>
                                <input
                                    type="text"
                                    className="input profile-name-input"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="Your display name"
                                    maxLength={50}
                                />
                            </div>
                        ) : (
                            <h1 className="profile-name">{profile?.display_name || 'Unknown'}</h1>
                        )}

                        <p className="profile-username">@{profile?.username}</p>

                        {isEditing ? (
                            <div className="input-group">
                                <label className="input-label">Bio</label>
                                <textarea
                                    className="input textarea profile-bio-input"
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

                        <div className="profile-metadata">
                            <p className="profile-joined">
                                📅 Joined {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', {
                                    month: 'long',
                                    year: 'numeric',
                                }) : 'Unknown'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
