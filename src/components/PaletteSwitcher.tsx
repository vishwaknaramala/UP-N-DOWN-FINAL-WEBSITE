import React, { useState, useEffect } from 'react';
import {
  BW_PALETTES,
  BWPaletteId,
  getStoredPalette,
  setStoredPalette,
  THEME_PALETTE_EVENT,
} from '../utils/themePalettes';
import { playTactileClick } from '../utils/audio';
import { Sun, Moon } from 'lucide-react';

interface PaletteSwitcherProps {
  variant?: 'navbar' | 'toggle';
  onPaletteChange?: (id: BWPaletteId) => void;
  className?: string;
}

export const PaletteSwitcher: React.FC<PaletteSwitcherProps> = ({
  variant = 'navbar',
  onPaletteChange,
  className = '',
}) => {
  const [activeId, setActiveId] = useState<BWPaletteId>(getStoredPalette());

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const custom = e as CustomEvent<BWPaletteId>;
      if (custom.detail) {
        setActiveId(custom.detail);
      } else {
        setActiveId(getStoredPalette());
      }
    };
    window.addEventListener(THEME_PALETTE_EVENT, handleUpdate);
    return () => window.removeEventListener(THEME_PALETTE_EVENT, handleUpdate);
  }, []);

  const handleSelect = (id: BWPaletteId) => {
    if (activeId === id) return;
    playTactileClick();
    setActiveId(id);
    setStoredPalette(id);
    if (onPaletteChange) onPaletteChange(id);
  };

  const handleToggle = () => {
    const next: BWPaletteId = activeId === 'black' ? 'white' : 'black';
    handleSelect(next);
  };

  // Compact Single-Button Toggle Variant
  if (variant === 'toggle') {
    const isDark = activeId === 'black';
    return (
      <button
        type="button"
        onClick={handleToggle}
        title={`Switch to ${isDark ? 'White' : 'Black'} Theme`}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider border border-[var(--border-main)] bg-[var(--bg-subtle)] hover:border-[var(--text-primary)] transition-all cursor-pointer ${className}`}
      >
        {isDark ? (
          <>
            <Moon className="w-3.5 h-3.5 text-zinc-300" />
            <span className="text-[10px]">BLACK</span>
          </>
        ) : (
          <>
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[10px]">WHITE</span>
          </>
        )}
      </button>
    );
  }

  // Segmented Pill Variant (Default in Navbar)
  return (
    <div
      className={`inline-flex items-center border border-[var(--border-main)] bg-[var(--bg-subtle)] p-0.5 select-none transition-colors ${className}`}
    >
      <button
        type="button"
        onClick={() => handleSelect('white')}
        className={`px-2 sm:px-2.5 py-1 text-[9.5px] sm:text-xs font-mono uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
          activeId === 'white'
            ? 'bg-white text-black shadow-sm ring-1 ring-black/30 font-extrabold'
            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
        }`}
        title="White Theme (Gallery Stark White)"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-white border border-black/80 shrink-0 shadow-xs" />
        <span>WHITE</span>
      </button>
      <button
        type="button"
        onClick={() => handleSelect('black')}
        className={`px-2 sm:px-2.5 py-1 text-[9.5px] sm:text-xs font-mono uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
          activeId === 'black'
            ? 'bg-black text-white shadow-sm ring-1 ring-white/30 font-extrabold'
            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
        }`}
        title="Black Theme (Void Pitch Black)"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-black border border-white/80 shrink-0 shadow-xs" />
        <span>BLACK</span>
      </button>
    </div>
  );
};
