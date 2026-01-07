'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import './ImageCropper.css';

interface ImageCropperProps {
    imageUrl: string;
    aspectRatio: 'square' | 'banner'; // square for avatar, banner for cover
    onSave: (position: { x: number; y: number }) => void;
    onCancel: () => void;
}

export default function ImageCropper({ imageUrl, aspectRatio, onSave, onCancel }: ImageCropperProps) {
    const [position, setPosition] = useState({ x: 50, y: 50 }); // percentage from center
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        setStartPos({ x: e.clientX, y: e.clientY });
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging || !containerRef.current) return;

        const deltaX = e.clientX - startPos.x;
        const deltaY = e.clientY - startPos.y;

        // Convert pixel movement to percentage (smaller = more precise)
        const sensitivity = 0.15;

        setPosition(prev => ({
            x: Math.max(0, Math.min(100, prev.x - deltaX * sensitivity)),
            y: Math.max(0, Math.min(100, prev.y - deltaY * sensitivity)),
        }));

        setStartPos({ x: e.clientX, y: e.clientY });
    }, [isDragging, startPos]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Touch events
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        const touch = e.touches[0];
        setIsDragging(true);
        setStartPos({ x: touch.clientX, y: touch.clientY });
    }, []);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!isDragging) return;

        const touch = e.touches[0];
        const deltaX = touch.clientX - startPos.x;
        const deltaY = touch.clientY - startPos.y;

        const sensitivity = 0.15;

        setPosition(prev => ({
            x: Math.max(0, Math.min(100, prev.x - deltaX * sensitivity)),
            y: Math.max(0, Math.min(100, prev.y - deltaY * sensitivity)),
        }));

        setStartPos({ x: touch.clientX, y: touch.clientY });
    }, [isDragging, startPos]);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('touchmove', handleTouchMove);
            window.addEventListener('touchend', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

    return (
        <div className="cropper-overlay">
            <div className="cropper-modal">
                <div className="cropper-header">
                    <h3>Adjust Position</h3>
                    <p>Drag to reposition</p>
                </div>

                <div
                    ref={containerRef}
                    className={`cropper-container ${aspectRatio} ${isDragging ? 'dragging' : ''}`}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                >
                    <img
                        src={imageUrl}
                        alt="Crop preview"
                        className="cropper-image"
                        style={{
                            objectPosition: `${position.x}% ${position.y}%`
                        }}
                        draggable={false}
                    />
                    <div className="cropper-hint">
                        <span>✋ Drag to move</span>
                    </div>
                </div>

                <div className="cropper-actions">
                    <button className="btn btn-ghost" onClick={onCancel}>
                        Cancel
                    </button>
                    <button className="btn btn-primary" onClick={() => onSave(position)}>
                        Apply
                    </button>
                </div>
            </div>
        </div>
    );
}
