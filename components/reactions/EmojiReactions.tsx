'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const QUICK_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🔥'];

interface EmojiReactionsProps {
    reactions?: { emoji: string; count: number; userReacted: boolean }[];
    onReact?: (emoji: string) => void;
}

export default function EmojiReactions({ reactions = [], onReact }: EmojiReactionsProps) {
    const [showPicker, setShowPicker] = useState(false);

    const handleReact = (emoji: string) => {
        onReact?.(emoji);
        setShowPicker(false);
    };

    return (
        <div className="emoji-reactions">
            <AnimatePresence>
                {reactions.map(({ emoji, count, userReacted }) => (
                    <motion.button
                        key={emoji}
                        className={`reaction-chip ${userReacted ? 'user-reacted' : ''}`}
                        onClick={() => handleReact(emoji)}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    >
                        <span className="reaction-emoji">{emoji}</span>
                        <span className="reaction-count">{count}</span>
                    </motion.button>
                ))}
            </AnimatePresence>

            <div className="reaction-add-container">
                <motion.button
                    className="reaction-add-btn"
                    onClick={() => setShowPicker(!showPicker)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    +
                </motion.button>

                <AnimatePresence>
                    {showPicker && (
                        <motion.div
                            className="reaction-picker"
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        >
                            {QUICK_REACTIONS.map((emoji) => (
                                <motion.button
                                    key={emoji}
                                    className="picker-emoji"
                                    onClick={() => handleReact(emoji)}
                                    whileHover={{ scale: 1.2 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    {emoji}
                                </motion.button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
