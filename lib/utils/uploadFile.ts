import { createClient } from '@/lib/supabase/client';

export type FileType = 'image' | 'video';

interface UploadResult {
    url: string | null;
    error: Error | null;
}

const MAX_FILE_SIZE = {
    image: 15 * 1024 * 1024, // 15MB for images (allows larger GIFs)
    video: 20 * 1024 * 1024, // 20MB for videos
};

const ALLOWED_TYPES = {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    video: ['video/mp4', 'video/webm', 'video/quicktime'],
};

/**
 * Validate a file before upload
 */
export function validateFile(file: File, type: FileType): { valid: boolean; error?: string } {
    // Check file type
    if (!ALLOWED_TYPES[type].includes(file.type)) {
        return {
            valid: false,
            error: `Invalid file type. Allowed types: ${ALLOWED_TYPES[type].join(', ')}`,
        };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE[type]) {
        const maxSizeMB = MAX_FILE_SIZE[type] / (1024 * 1024);
        return {
            valid: false,
            error: `File too large. Maximum size: ${maxSizeMB}MB`,
        };
    }

    return { valid: true };
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
    file: File,
    bucket: 'avatars' | 'posts' | 'banners',
    folder?: string
): Promise<UploadResult> {
    const supabase = createClient();

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    try {
        const { data, error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
            });

        if (uploadError) {
            console.error('Supabase Upload Error Details:', uploadError);
            throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return { url: publicUrl, error: null };
    } catch (error) {
        return { url: null, error: error as Error };
    }
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(
    url: string,
    bucket: 'avatars' | 'posts' | 'banners'
): Promise<{ error: Error | null }> {
    const supabase = createClient();

    // Extract file path from URL
    const urlParts = url.split(`/${bucket}/`);
    if (urlParts.length < 2) {
        return { error: new Error('Invalid file URL') };
    }

    const filePath = urlParts[1];

    try {
        const { error } = await supabase.storage
            .from(bucket)
            .remove([filePath]);

        if (error) throw error;

        return { error: null };
    } catch (error) {
        return { error: error as Error };
    }
}

/**
 * Upload multiple files
 */
export async function uploadMultipleFiles(
    files: File[],
    bucket: 'avatars' | 'posts' | 'banners',
    folder?: string
): Promise<{ urls: string[]; errors: Error[] }> {
    const results = await Promise.all(
        files.map((file) => uploadFile(file, bucket, folder))
    );

    const urls: string[] = [];
    const errors: Error[] = [];

    results.forEach((result) => {
        if (result.url) {
            urls.push(result.url);
        }
        if (result.error) {
            errors.push(result.error);
        }
    });

    return { urls, errors };
}
