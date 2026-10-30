import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ArrowUpRight, Sparkles, BookOpen, Eye, Flame, Ticket, RotateCw } from 'lucide-react';
import { playTactileClick } from '../utils/audio';
import { BrandLogo } from './BrandLogo';
import { PaletteSwitcher } from './PaletteSwitcher';
import { BW_PALETTES, BWPaletteId, getStoredPalette, setStoredPalette } from '../utils/themePalettes';

interface NavbarProps {
  onJoinWaitlistClick: () => void;
  hasVipPass: boolean;
  onViewVipPass: () => void;
  onReloadVault?: () => void;
  onOpenDeveloperPortal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onJoinWaitlistClick,
  hasVipPass,
  onViewVipPass,
  onReloadVault,
  onOpenDeveloperPortal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentPalette, setCurrentPalette] = useState<BWPaletteId>(getStoredPalette());

  const handleNavClick = (targetId: string) => {
    playTactileClick();
    setMobileMenuOpen(false);
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleMobilePaletteChange = (id: BWPaletteId) => {
    playTactileClick();
    setCurrentPalette(id);
    setStoredPalette(id);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[var(--bg-main)]/95 backdrop-blur-md border-b border-[var(--border-main)] transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-6 px-4 sm:px-6 py-2.5 sm:py-4">
        {/* Zone 1: Brand mark with logo replacement trigger */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              playTactileClick();
              setMobileMenuOpen(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            title="Scroll to top"
            className="flex items-center gap-2 text-base sm:text-lg font-black tracking-[0.18em] sm:tracking-[0.2em] text-[var(--text-primary)] hover:opacity-85 transition-opacity whitespace-nowrap shrink-0 font-display select-none cursor-pointer"
          >
            <BrandLogo size={26} />
            <span>UP N DOWN</span>
          </a>
        </div>

        {/* Zone 2: Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-5 lg:gap-7 text-xs font-mono tracking-wider">
          <button
            onClick={() => handleNavClick('3d-runway')}
            className="text-[var(--text-primary)] hover:opacity-80 transition-opacity whitespace-nowrap shrink-0 focus-visible:outline-none cursor-pointer font-bold flex items-center gap-1.5 uppercase"
          >
            <span className="w-1.5 h-1.5 bg-[var(--text-primary)] rounded-full animate-pulse" />
            <span>3D RUNWAY</span>
          </button>
          <button
            onClick={() => handleNavClick('our-story')}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors whitespace-nowrap shrink-0 cursor-pointer uppercase font-bold"
          >
            OUR STORY
          </button>
          <button
            onClick={() => handleNavClick('collection')}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors whitespace-nowrap shrink-0 cursor-pointer uppercase font-bold"
          >
            LOOKBOOK
          </button>
          <button
            onClick={() => handleNavClick('waitlist')}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors whitespace-nowrap shrink-0 cursor-pointer uppercase font-bold"
          >
            THE CLUB
          </button>
        </nav>

        {/* Zone 3: Palette Switcher & Primary Action */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Black & White Palette Selector */}
          <PaletteSwitcher variant="navbar" />

          {hasVipPass ? (
            <button
              onClick={() => {
                playTactileClick();
                onViewVipPass();
              }}
              className="hidden sm:flex items-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--btn-text)] bg-[var(--btn-bg)] hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
            >
              <span>View Club Pass</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => {
                playTactileClick();
                onJoinWaitlistClick();
              }}
              className="hidden sm:flex px-3.5 sm:px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--btn-text)] bg-[var(--btn-bg)] hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
            >
              <span>Join The Club</span>
            </button>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => {
              playTactileClick();
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            aria-label="Toggle navigation menu"
            className="md:hidden p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Clean Mobile Dropdown Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="md:hidden border-t border-[var(--border-subtle)] bg-[var(--bg-main)]/98 backdrop-blur-md px-5 py-5 space-y-4 shadow-2xl"
          >
            <div className="flex flex-col space-y-2 font-mono text-sm tracking-wider">
              <button
                onClick={() => handleNavClick('3d-runway')}
                className="text-left py-2 text-[var(--text-primary)] hover:opacity-75 transition-opacity font-bold uppercase flex items-center justify-between border-b border-[var(--border-subtle)]/50"
              >
                <span>3D Runway</span>
                <Sparkles className="w-4 h-4 text-[var(--text-muted)]" />
              </button>
              <button
                onClick={() => handleNavClick('our-story')}
                className="text-left py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors uppercase font-bold flex items-center justify-between border-b border-[var(--border-subtle)]/50"
              >
                <span>Our Story</span>
                <BookOpen className="w-4 h-4 text-[var(--text-muted)]" />
              </button>
              <button
                onClick={() => handleNavClick('collection')}
                className="text-left py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors uppercase font-bold flex items-center justify-between border-b border-[var(--border-subtle)]/50"
              >
                <span>Lookbook &amp; Pieces</span>
                <Eye className="w-4 h-4 text-[var(--text-muted)]" />
              </button>
              <button
                onClick={() => handleNavClick('waitlist')}
                className="text-left py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors uppercase font-bold flex items-center justify-between border-b border-[var(--border-subtle)]/50"
              >
                <span>The Club (100 Slots)</span>
                <Flame className="w-4 h-4 text-[var(--text-muted)]" />
              </button>
            </div>

            {/* Mobile Theme Preference Selector */}
            <div className="flex items-center justify-between py-2 px-3 bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
              <span className="text-xs font-mono uppercase font-bold text-[var(--text-secondary)]">
                Color Theme:
              </span>
              <PaletteSwitcher variant="navbar" />
            </div>

            <div className="pt-2 flex flex-col gap-2">
              {hasVipPass ? (
                <button
                  onClick={() => {
                    playTactileClick();
                    setMobileMenuOpen(false);
                    onViewVipPass();
                  }}
                  className="w-full py-3 text-xs font-mono font-bold uppercase tracking-wider text-[var(--btn-text)] bg-[var(--btn-bg)] flex items-center justify-center gap-2 shadow cursor-pointer"
                >
                  <Ticket className="w-4 h-4" />
                  <span>View Member Pass</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    playTactileClick();
                    setMobileMenuOpen(false);
                    onJoinWaitlistClick();
                  }}
                  className="w-full py-3 text-xs font-mono font-bold uppercase tracking-wider text-[var(--btn-text)] bg-[var(--btn-bg)] flex items-center justify-center gap-2 shadow cursor-pointer"
                >
                  <span>Join The Club (100 Slots)</span>
                </button>
              )}

              {onOpenDeveloperPortal && (
                <button
                  onClick={() => {
                    playTactileClick();
                    setMobileMenuOpen(false);
                    onOpenDeveloperPortal();
                  }}
                  className="text-center py-2 text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  Developer Portal
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
