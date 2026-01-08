'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import Dock from '@/components/layout/Dock';
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
        return <AndromedaLoader message="Entering the cosmos..." />;
    }

    return (
        <div className="app-container">
            {/* Global Cosmic Background Layers */}
            <div className="cosmic-bg-layer">
                <div className="starfield" />
                <div className="nebula-cloud-1" />
                <div className="nebula-cloud-2" />
                <div className="grid-overlay" />
            </div>

            <Dock />

            <main className="main-content">
                <PageTransition>
                    {children}
                </PageTransition>
            </main>
        </div>
    );
}
