import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrandLogo } from './BrandLogo';
import { ShieldCheck, Lock, Terminal } from 'lucide-react';

interface ReloadPreloaderProps {
  forceTrigger?: number;
  onComplete?: () => void;
}

const BOOT_LOGS = [
  'INITIALIZING ATELIER SECURITY PROTOCOL v2.4...',
  'FETCHING ARCHIVAL BLUEPRINT REPOSITORIES...',
  'ENFORCING EMBARGO POLICY: VISUAL ARTWORK SEALED UNTIL 31ST DEC 2026...',
  'VERIFYING 4 SIGNATURE PIECES (CAP 07, DENIM 01, TEE 01, TEE 02)...',
  'SYNCHRONIZING BESPOKE TECH PACK EMBROIDERY BLUEPRINTS...',
  'COMPILING PRE-RESERVATION QUOTA (STRICT 100 SLOTS PER PIECE)...',
  'CIPHER VERIFIED // ALLOCATING ATELIER VAULT...',
];

export const ReloadPreloader: React.FC<ReloadPreloaderProps> = ({
  forceTrigger = 0,
  onComplete,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [logIndex, setLogIndex] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    setProgress(0);
    setLogIndex(0);

    const startTime = Date.now();
    const duration = 1600; // 1.6s high-speed brutalist loader

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(pct);

      const targetLogIdx = Math.min(
        BOOT_LOGS.length - 1,
        Math.floor((pct / 100) * BOOT_LOGS.length)
      );
      setLogIndex(targetLogIdx);

      if (pct >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsVisible(false);
          if (onComplete) onComplete();
        }, 320);
      }
    }, 24);

    return () => clearInterval(interval);
  }, [forceTrigger, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[100] bg-[var(--bg-main)] text-[var(--text-primary)] flex flex-col justify-between p-6 sm:p-12 font-mono select-none transition-colors duration-300 shadow-2xl"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4 text-xs tracking-widest text-[var(--text-muted)] uppercase">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[var(--text-primary)] font-bold">UP N DOWN // ATELIER CIPHER</span>
            </div>
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <Lock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>EMBARGOED UNTIL 31ST DEC 2026</span>
            </div>
          </div>

          {/* Centerpiece Monogram & Percent */}
          <div className="my-auto max-w-xl mx-auto w-full text-center space-y-6">
            <div className="relative inline-flex items-center justify-center p-4">
              {/* Outer Technical Orbital Radar Ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 3.5, ease: 'linear' }}
                className="absolute inset-0 rounded-full border border-dashed border-[var(--border-strong)] opacity-60"
              />
              <motion.div
                animate={{ scale: [0.97, 1.03, 0.97] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className="relative z-10"
              >
                <BrandLogo size={64} showStarGlow className="shadow-2xl" />
              </motion.div>
            </div>

            <div className="space-y-2">
              <div className="text-4xl sm:text-6xl font-black font-display tracking-tight text-[var(--text-primary)] uppercase">
                UP N DOWN
              </div>
              <div className="text-xs sm:text-sm font-mono tracking-[0.28em] text-[var(--text-muted)] uppercase font-bold">
                SAME ENERGY. DIFFERENT PHASE.
              </div>
            </div>

            {/* Progress Bar & Counter */}
            <div className="space-y-3 pt-4">
              <div className="flex items-baseline justify-between text-xs font-mono text-[var(--text-muted)]">
                <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                  <Terminal className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <span className="truncate max-w-[280px] sm:max-w-md text-left font-mono">
                    {BOOT_LOGS[logIndex]}
                  </span>
                </span>
                <span className="text-lg font-bold text-[var(--text-primary)] tabular-nums ml-2">
                  {progress}%
                </span>
              </div>

              <div className="w-full bg-[var(--bg-subtle)] border border-[var(--border-main)] h-2 overflow-hidden p-0.5">
                <motion.div
                  className="bg-[var(--text-primary)] h-full"
                  style={{ width: `${progress}%` }}
                  transition={{ ease: 'easeOut', duration: 0.05 }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] uppercase tracking-widest pt-1 font-mono">
                <span>100 SLOTS ALLOCATION</span>
                <span>DESIGNS SEALED FOR PRIVATE LAUNCH</span>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-4 text-[11px] text-[var(--text-muted)]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[var(--text-secondary)]">DROP 01 // BESPOKE PATTERNS &amp; SELVEDGE EMBROIDERIES</span>
            </div>
            <div>
              OFFICIAL DATE: 31ST DEC 2026 · 18:00 IST
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
