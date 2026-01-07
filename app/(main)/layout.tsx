'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import Sidebar from '@/components/layout/Sidebar';
import PageTransition from '@/components/motion/PageTransition';
import './main-layout.css';

// Ambient background orbs component
function AmbientOrbs() {
    return (
        <>
            <div className="ambient-orb-1" aria-hidden="true" />
            <div className="ambient-orb-2" aria-hidden="true" />
            <div className="ambient-orb-3" aria-hidden="true" />
            <div className="ambient-orb-4" aria-hidden="true" />
        </>
    );
}

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { loading } = useAuth();

    if (loading) {
        return (
            <div className="app-loading">
                <AmbientOrbs />
                <div className="spinner" />
            </div>
        );
    }

    return (
        <div className="app-container">
            <AmbientOrbs />
            <Sidebar />
            <main className="main-content">
                <PageTransition>
                    {children}
                </PageTransition>
            </main>
        </div>
    );
}
