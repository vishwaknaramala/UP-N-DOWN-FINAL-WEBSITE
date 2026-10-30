import React from 'react';
import { Volume2, VolumeX, Download, ArrowUp, Sun, Moon } from 'lucide-react';
import { playTactileClick, setSoundEnabled, isSoundEnabled } from '../utils/audio';
import { BrandLogo } from './BrandLogo';
import { PaletteSwitcher } from './PaletteSwitcher';

interface FooterProps {
  onOpenPrivacy: () => void;
  onOpenDeveloperPortal?: () => void;
  isInstallable: boolean;
  onInstall: () => void;
  isOnline: boolean;
  soundActive: boolean;
  onToggleSound: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenPrivacy,
  onOpenDeveloperPortal,
  isInstallable,
  onInstall,
  isOnline,
  soundActive,
  onToggleSound,
}) => {
  const scrollToTop = () => {
    playTactileClick();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[var(--bg-main)] border-t border-[var(--border-main)] text-[var(--text-secondary)] py-12 sm:py-16 px-4 sm:px-6 transition-colors">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Main Footer Row */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-12">
          {/* Brand Info */}
          <div className="space-y-4 max-w-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <BrandLogo size={32} />
                <span className="text-xl font-black tracking-[0.25em] text-[var(--text-primary)] font-display block">
                  UP N DOWN
                </span>
              </div>
              <div className="text-xs font-mono text-[var(--text-muted)] font-bold uppercase tracking-widest pl-11">
                SAME ENERGY. DIFFERENT PHASE.
              </div>
            </div>
            <p className="text-xs text-[var(--text-secondary)] font-light leading-relaxed">
              Born from passion, UP N DOWN was created to redefine streetwear with a premium feel. Quality fabrics, precise stitching, and distinctive designs. Releasing 31st Dec 2026.
            </p>
            <div className="space-y-1.5 text-[11px] font-mono text-[var(--text-muted)]">
              <div>
                Official Instagram: <a href="https://instagram.com/upndown.ofc" target="_blank" rel="noopener noreferrer" className="text-[var(--text-primary)] hover:underline font-bold">@upndown.ofc</a>
              </div>
              <div>
                Official Store Mail: <a href="mailto:upndownofficialstore@gmail.com" className="text-[var(--text-primary)] hover:underline font-bold">upndownofficialstore@gmail.com</a>
              </div>
            </div>
          </div>

          {/* Quick Links & Utilities */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs font-mono">
            <div className="space-y-3">
              <span className="text-[var(--text-primary)] uppercase font-bold block tracking-wider">Navigation</span>
              <ul className="space-y-2 text-[var(--text-secondary)] font-bold">
                <li><a href="#countdown" className="hover:text-[var(--text-primary)] transition-colors">LAUNCH DROP</a></li>
                <li><a href="#3d-runway" className="hover:text-[var(--text-primary)] transition-colors">3D RUNWAY</a></li>
                <li><a href="#our-story" className="hover:text-[var(--text-primary)] transition-colors">OUR STORY</a></li>
                <li><a href="#collection" className="hover:text-[var(--text-primary)] transition-colors">LOOKBOOK</a></li>
                <li><a href="#waitlist" className="hover:text-[var(--text-primary)] transition-colors">THE CLUB</a></li>
              </ul>
            </div>

            <div className="space-y-3">
              <span className="text-[var(--text-primary)] uppercase font-bold block tracking-wider">Client Care</span>
              <ul className="space-y-2 text-[var(--text-secondary)]">
                <li>
                  <a href="mailto:upndownofficialstore@gmail.com" className="hover:text-[var(--text-primary)] transition-colors text-left block text-[var(--text-primary)] font-bold">
                    Official Inquiries: upndownofficialstore@gmail.com
                  </a>
                </li>
                <li>
                  <button onClick={onOpenPrivacy} className="hover:text-[var(--text-primary)] transition-colors text-left cursor-pointer">
                    Data Privacy &amp; Encryption
                  </button>
                </li>
                <li>
                  <span className="text-[var(--text-muted)] cursor-default">Worldwide Insured Freight</span>
                </li>
                <li>
                  <span className="text-[var(--text-muted)] cursor-default">14-Day Archival Exchange</span>
                </li>
                {onOpenDeveloperPortal && (
                  <li className="pt-2 border-t border-[var(--border-subtle)]">
                    <button
                      onClick={() => {
                        playTactileClick();
                        onOpenDeveloperPortal();
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-emerald-400 hover:text-emerald-300 bg-emerald-950/20 hover:bg-emerald-950/40 border border-emerald-900/60 font-bold transition-all cursor-pointer text-[11px]"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>DEVELOPER / ADMIN LOGIN</span>
                    </button>
                  </li>
                )}
              </ul>
            </div>

            <div className="space-y-3">
              <span className="text-[var(--text-primary)] uppercase font-bold block tracking-wider">Theme &amp; Audio</span>
              <div className="space-y-2.5">
                <div>
                  <div className="text-[10px] text-[var(--text-muted)] uppercase mb-1">Color Palette</div>
                  <PaletteSwitcher variant="navbar" />
                </div>

                <button
                  onClick={onToggleSound}
                  className="flex items-center gap-2 hover:text-[var(--text-primary)] transition-colors text-[var(--text-secondary)] cursor-pointer pt-1"
                >
                  {soundActive ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <span>Sound Effects: {soundActive ? 'ON' : 'OFF'}</span>
                </button>

                {isInstallable && (
                  <button
                    onClick={onInstall}
                    className="flex items-center gap-2 hover:text-[var(--text-primary)] transition-colors text-[var(--text-secondary)] cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Install PWA App</span>
                  </button>
                )}

                <div className="text-[11px] text-[var(--text-muted)] pt-1">
                  Status: {isOnline ? 'Online (Real-Time)' : 'Offline (Cached)'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[var(--text-muted)]">
          <div>
            © 2026 UP N DOWN · SAME ENERGY DIFFERENT PHASE · ALL RIGHTS RESERVED.
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            {onOpenDeveloperPortal && (
              <button
                onClick={() => {
                  playTactileClick();
                  onOpenDeveloperPortal();
                }}
                className="text-emerald-400 hover:underline cursor-pointer font-bold"
              >
                Developer Access
              </button>
            )}
            <button
              onClick={onOpenPrivacy}
              className="hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              Zero-Tracker Privacy Architecture
            </button>
            <button
              onClick={scrollToTop}
              className="flex items-center gap-1.5 hover:text-[var(--text-primary)] transition-colors cursor-pointer text-[var(--text-secondary)]"
            >
              <span>Back To Top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
