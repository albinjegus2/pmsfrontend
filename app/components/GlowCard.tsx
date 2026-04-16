'use client';

import { ReactNode } from 'react';

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  goldBorder?: boolean;
}

/**
 * Simplified GlowCard - Removes all mouse-tracking tilt and 3D effects
 * per user request for a "neat and simple" UI with no hover shadows.
 */
export default function GlowCard({ children, className = '', goldBorder = false }: GlowCardProps) {
  return (
    <div
      className={`glow-card ${goldBorder ? 'border-primary-500/30' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
