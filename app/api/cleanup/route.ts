import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// This API route cleans up old data to manage Supabase free tier limits
// It deletes messages, posts, and files older than 5 days
// You can set up a cron job to call this endpoint daily

const CLEANUP_DAYS = 5; // Delete data older than this many days

export async function GET(request: Request) {
    // Verify cleanup secret (for security)
    const authHeader = request.headers.get('authorization');
    const cleanupSecret = process.env.CLEANUP_SECRET || 'andcord-cleanup-secret';

    if (authHeader !== `Bearer ${cleanupSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role key for admin operations
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CLEANUP_DAYS);
    const cutoffISO = cutoffDate.toISOString();

    const results = {
        deletedMessages: 0,
        deletedGroupMessages: 0,
        deletedNotifications: 0,
        deletedFiles: 0,
        errors: [] as string[],
    };

    try {
        // 1. Get old messages with media URLs before deleting
        const { data: oldMessages } = await supabaseAdmin
            .from('messages')
            .select('id, media_url')
            .lt('created_at', cutoffISO);

        // Delete old files from storage
        if (oldMessages && oldMessages.length > 0) {
            const filesToDelete = oldMessages
                .filter((m: { media_url?: string }) => m.media_url)
                .map((m: { media_url?: string }) => {
                    // Extract file path from URL
                    const url = m.media_url;
                    if (url && url.includes('/messages/')) {
                        const path = url.split('/messages/')[1];
                        return path;
                    }
                    return null;
                })
                .filter(Boolean) as string[];

            if (filesToDelete.length > 0) {
                const { error: storageError } = await supabaseAdmin
                    .storage
                    .from('messages')
                    .remove(filesToDelete);

                if (storageError) {
                    results.errors.push(`Storage cleanup error: ${storageError.message}`);
                } else {
                    results.deletedFiles = filesToDelete.length;
                }
            }

            results.deletedMessages = oldMessages.length;
        }

        // 2. Delete old messages
        const { error: messagesError } = await supabaseAdmin
            .from('messages')
            .delete()
            .lt('created_at', cutoffISO);

        if (messagesError) {
            results.errors.push(`Messages cleanup error: ${messagesError.message}`);
        }

        // 3. Count and delete old group messages
        const { data: oldGroupMessages } = await supabaseAdmin
            .from('group_messages')
            .select('id')
            .lt('created_at', cutoffISO);

        if (oldGroupMessages) {
            results.deletedGroupMessages = oldGroupMessages.length;
        }

        const { error: groupMessagesError } = await supabaseAdmin
            .from('group_messages')
            .delete()
            .lt('created_at', cutoffISO);

        if (groupMessagesError) {
            results.errors.push(`Group messages cleanup error: ${groupMessagesError.message}`);
        }

        // 4. Delete old notifications (older than 7 days for notifications)
        const notificationCutoff = new Date();
        notificationCutoff.setDate(notificationCutoff.getDate() - 7);

        const { data: oldNotifications } = await supabaseAdmin
            .from('notifications')
            .select('id')
            .lt('created_at', notificationCutoff.toISOString());

        if (oldNotifications) {
            results.deletedNotifications = oldNotifications.length;
        }

        const { error: notificationsError } = await supabaseAdmin
            .from('notifications')
            .delete()
            .lt('created_at', notificationCutoff.toISOString());

        if (notificationsError) {
            results.errors.push(`Notifications cleanup error: ${notificationsError.message}`);
        }

        return NextResponse.json({
            success: true,
            message: `Cleanup completed. Deleted ${results.deletedMessages} messages, ${results.deletedGroupMessages} group messages, ${results.deletedNotifications} notifications, ${results.deletedFiles} files.`,
            results,
            cutoffDate: cutoffISO,
        });

    } catch (error) {
        console.error('Cleanup error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Cleanup failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// Also support POST for flexibility
export async function POST(request: Request) {
    return GET(request);
}
