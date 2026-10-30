import React, { useState, useEffect } from 'react';
import { getStoredLogoUrl, DEVELOPER_DATA_UPDATED, OFFICIAL_LOGO_URL } from '../utils/developerStorage';

interface BrandLogoProps {
  className?: string;
  size?: number | string;
  showStarGlow?: boolean;
  variant?: 'mark' | 'lockup';
  rounded?: boolean;
}

/**
 * UP N DOWN Official Master Logo
 * Renders the authentic high-resolution master monogram logo (/assets/aistudio/UP_N_DOWN_LOGO_00d318c2.png)
 * Brand: UP N DOWN
 * Philosophy: SAME ENERGY DIFFERENT PHASE
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 40,
  showStarGlow = false,
  variant = 'mark',
  rounded = true,
}) => {
  const [logoSrc, setLogoSrc] = useState<string>(OFFICIAL_LOGO_URL);

  useEffect(() => {
    setLogoSrc(getStoredLogoUrl() || OFFICIAL_LOGO_URL);
    const handleUpdate = () => {
      setLogoSrc(getStoredLogoUrl() || OFFICIAL_LOGO_URL);
    };
    window.addEventListener(DEVELOPER_DATA_UPDATED, handleUpdate);
    return () => window.removeEventListener(DEVELOPER_DATA_UPDATED, handleUpdate);
  }, []);

  const numSize = typeof size === 'number' ? size : parseInt(String(size), 10) || 40;

  const markElement = (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden bg-black border border-[var(--border-main)] shadow-lg select-none transition-transform duration-300 hover:scale-[1.03] ${
        rounded ? 'rounded-full' : 'rounded-sm'
      } ${className}`}
      style={{ width: numSize, height: numSize }}
      title="UP N DOWN · Same Energy Different Phase"
    >
      <img
        src={logoSrc}
        alt="UP N DOWN Master Logo"
        className="w-full h-full object-cover select-none pointer-events-none"
        loading="eager"
        onError={(e) => {
          // Fallback if custom URL fails
          (e.currentTarget as HTMLImageElement).src = OFFICIAL_LOGO_URL;
        }}
      />
      {showStarGlow && (
        <span className="absolute inset-0 rounded-full ring-1 ring-white/40 animate-pulse pointer-events-none" />
      )}
    </div>
  );

  if (variant === 'lockup') {
    return (
      <div className={`inline-flex items-center gap-3 select-none ${className}`}>
        {markElement}
        <div className="flex flex-col">
          <span className="font-display font-black tracking-[0.22em] text-[var(--text-primary)] uppercase text-base leading-none">
            UP N DOWN
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-[var(--text-muted)] mt-1 leading-none">
            SAME ENERGY DIFFERENT PHASE
          </span>
        </div>
      </div>
    );
  }

  return markElement;
};
