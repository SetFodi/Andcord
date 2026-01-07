'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    glow?: boolean;
    children: React.ReactNode;
}

const AnimatedButton = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = 'primary', size = 'md', glow = false, className = '', children, ...props }, ref) => {
        const baseClasses = 'btn';
        const variantClasses = {
            primary: 'btn-primary',
            secondary: 'btn-secondary',
            ghost: 'btn-ghost',
            danger: 'btn-premium-danger',
        };
        const sizeClasses = {
            sm: 'btn-sm',
            md: '',
            lg: 'btn-lg',
        };
        const glowClass = glow ? 'glow-accent' : '';

        const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${glowClass} ${className}`.trim();

        return (
            <motion.button
                ref={ref}
                className={combinedClasses}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98, y: 0 }}
                transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 17,
                }}
                {...props}
            >
                {children}
            </motion.button>
        );
    }
);

AnimatedButton.displayName = 'AnimatedButton';
export default AnimatedButton;
