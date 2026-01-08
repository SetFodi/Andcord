"use client";

import { useState, useEffect, ReactNode } from "react";
import AndromedaLoader from "@/components/ui/AndromedaLoader";

interface InitialLoaderProps {
    children: ReactNode;
    minDisplayTime?: number;
}

export default function InitialLoader({
    children,
    minDisplayTime = 2000,
}: InitialLoaderProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [shouldRender, setShouldRender] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
            // Allow fade-out animation to complete
            setTimeout(() => setShouldRender(false), 500);
        }, minDisplayTime);

        return () => clearTimeout(timer);
    }, [minDisplayTime]);

    return (
        <>
            {shouldRender && (
                <div className={isLoading ? "" : "fade-out-wrapper"}>
                    <AndromedaLoader />
                </div>
            )}
            <div style={{ visibility: isLoading ? "hidden" : "visible" }}>
                {children}
            </div>
        </>
    );
}
