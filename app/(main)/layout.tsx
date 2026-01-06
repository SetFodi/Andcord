'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import Sidebar from '@/components/layout/Sidebar';
import './main-layout.css';

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { loading } = useAuth();

    if (loading) {
        return (
            <div className="app-loading">
                <div className="spinner" />
            </div>
        );
    }

    return (
        <div className="app-container">
            <Sidebar />
            <main className="main-content">
                {children}
            </main>
        </div>
    );
}
