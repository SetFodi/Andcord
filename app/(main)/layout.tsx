'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import Sidebar from '@/components/layout/Sidebar';
import PageTransition from '@/components/motion/PageTransition';
import AndromedaLoader from '@/components/ui/AndromedaLoader';
import './main-layout.css';

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { loading } = useAuth();

    if (loading) {
        return <AndromedaLoader message="Loading your space..." />;
    }

    return (
        <div className="app-container">
            <Sidebar />
            <main className="main-content">
                <PageTransition>
                    {children}
                </PageTransition>
            </main>
        </div>
    );
}
