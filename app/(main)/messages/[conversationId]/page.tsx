'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MessagesPage from '../page';

export default function ConversationPage() {
    const params = useParams();
    const router = useRouter();
    const conversationId = params?.conversationId as string;

    // If no conversationId, redirect to messages
    useEffect(() => {
        if (!conversationId) {
            router.replace('/messages');
        }
    }, [conversationId, router]);

    // Render the main messages page - it will pick up the conversationId from params
    return <MessagesPage />;
}
