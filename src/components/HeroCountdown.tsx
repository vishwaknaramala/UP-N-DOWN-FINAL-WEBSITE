import React, { useState, useEffect } from 'react';
import { motion, type Variants } from 'motion/react';
import { ArrowDown, Bell, ShieldCheck, Sparkles, Calendar, Palette } from 'lucide-react';
import { getStoredConfig, DEVELOPER_DATA_UPDATED } from '../utils/developerStorage';
import { playTactileClick } from '../utils/audio';

interface HeroCountdownProps {
  onJoinClick: () => void;
  onExploreClick: () => void;
  onRunwayClick?: () => void;
  onRemindMeClick: () => void;
  hasPass: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export const HeroCountdown: React.FC<HeroCountdownProps> = ({
  onJoinClick,
  onExploreClick,
  onRunwayClick,
  onRemindMeClick,
  hasPass,
}) => {
  const [config, setConfig] = useState(getStoredConfig());
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalMs: 0,
  });

  useEffect(() => {
    const handleUpdate = () => {
      setConfig(getStoredConfig());
    };
    window.addEventListener(DEVELOPER_DATA_UPDATED, handleUpdate);
    return () => window.removeEventListener(DEVELOPER_DATA_UPDATED, handleUpdate);
  }, []);

  useEffect(() => {
    const targetDate = new Date(config.launchDateStr).getTime();

    const calculateTime = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, totalMs: difference });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [config.launchDateStr]);

  const formatNumber = (num: number) => String(num).padStart(2, '0');

  return (
    <section id="countdown" className="relative pt-8 sm:pt-16 pb-14 sm:pb-20 px-4 sm:px-6 max-w-7xl mx-auto border-b border-[var(--border-main)] transition-colors">
      {/* Background architectural grid lines */}
      <div className="absolute inset-0 streetwear-grid opacity-20 pointer-events-none" />

      {/* Hero Core Display: 2 Balanced Columns on Desktop, Clean Stack on Mobile */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
        {/* Left Column: Bold, Restrained Typography */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="lg:col-span-7 space-y-6 sm:space-y-8"
        >
          <motion.div variants={itemVariants} className="space-y-3 sm:space-y-4">
            <div className="text-xs font-mono uppercase tracking-[0.25em] text-[var(--text-muted)]">
              DROP 01 · 31ST DEC 2026
            </div>
            
            <div className="space-y-1">
              <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-[var(--text-primary)] uppercase font-display leading-[0.92] text-balance">
                UP N DOWN
              </h1>
              <p className="text-xs sm:text-sm font-mono uppercase tracking-[0.25em] text-[var(--text-muted)] font-bold">
                SAME ENERGY. DIFFERENT PHASE.
              </p>
            </div>

            <p className="text-base sm:text-lg text-[var(--text-secondary)] max-w-xl font-light leading-relaxed">
              Redefining streetwear with heavyweight milled cottons, architectural silhouettes, and a strictly limited 100-member drop allocation.
            </p>
          </motion.div>

          {/* Clean Unboxed Fabric Specs */}
          <motion.div
            variants={itemVariants}
            className="flex items-center gap-6 sm:gap-8 text-xs font-mono text-[var(--text-secondary)] border-y border-[var(--border-subtle)] py-3"
          >
            <div>
              <span className="text-[var(--text-primary)] font-bold text-sm block">320 GSM</span>
              <span className="text-[var(--text-muted)] text-[11px]">Heavy Cotton</span>
            </div>
            <div className="w-px h-6 bg-[var(--border-subtle)]" />
            <div>
              <span className="text-[var(--text-primary)] font-bold text-sm block">14.5 oz</span>
              <span className="text-[var(--text-muted)] text-[11px]">Raw Selvedge</span>
            </div>
            <div className="w-px h-6 bg-[var(--border-subtle)]" />
            <div>
              <span className="text-[var(--text-primary)] font-bold text-sm block">100 Slots</span>
              <span className="text-[var(--text-muted)] text-[11px]">Exclusive Allocation</span>
            </div>
          </motion.div>

          {/* Clean 2-Button Action Bar */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
            <button
              onClick={() => {
                playTactileClick();
                onJoinClick();
              }}
              className="px-6 py-3.5 sm:py-4 text-xs font-bold uppercase tracking-[0.2em] text-[var(--btn-text)] bg-[var(--btn-bg)] hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 shadow"
            >
              <Bell className="w-4 h-4" />
              <span>{hasPass ? 'VIEW CLUB PASS' : 'JOIN THE CLUB'}</span>
            </button>
            <button
              onClick={() => {
                playTactileClick();
                onExploreClick();
              }}
              className="px-6 py-3.5 sm:py-4 text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-primary)] bg-[var(--bg-subtle)] border border-[var(--border-main)] hover:border-[var(--text-primary)] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>EXPLORE LOOKBOOK</span>
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        </motion.div>

        {/* Right Column: Clean Launch Chronometer Box */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5"
        >
          <div className="bg-[var(--bg-card)] border border-[var(--border-main)] p-5 sm:p-8 backdrop-blur-sm shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3.5">
              <span className="text-[11px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
                LAUNCH COUNTDOWN
              </span>
              <span className="text-[11px] font-mono text-[var(--text-primary)] font-bold">
                {config.launchDateDisplay.toUpperCase()} · 18:00 IST
              </span>
            </div>

            {/* 4-Column Live Timer */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-[var(--bg-subtle)] border border-[var(--border-subtle)] p-3">
                <div className="text-2xl sm:text-4xl font-mono font-bold text-[var(--text-primary)] tabular-nums">
                  {formatNumber(timeLeft.days)}
                </div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] mt-1">
                  Days
                </div>
              </div>

              <div className="bg-[var(--bg-subtle)] border border-[var(--border-subtle)] p-3">
                <div className="text-2xl sm:text-4xl font-mono font-bold text-[var(--text-primary)] tabular-nums">
                  {formatNumber(timeLeft.hours)}
                </div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] mt-1">
                  Hours
                </div>
              </div>

              <div className="bg-[var(--bg-subtle)] border border-[var(--border-subtle)] p-3">
                <div className="text-2xl sm:text-4xl font-mono font-bold text-[var(--text-primary)] tabular-nums">
                  {formatNumber(timeLeft.minutes)}
                </div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] mt-1">
                  Mins
                </div>
              </div>

              <div className="bg-[var(--bg-subtle)] border border-[var(--border-subtle)] p-3">
                <div className="text-2xl sm:text-4xl font-mono font-bold text-[var(--text-primary)] tabular-nums">
                  {formatNumber(timeLeft.seconds)}
                </div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] mt-1">
                  Secs
                </div>
              </div>
            </div>

            {/* Club Allocation Status Bar */}
            <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2.5">
              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-mono">
                <span>The Club Allocations:</span>
                <span className="text-[var(--text-primary)] font-bold">
                  {config.claimedSlots} / {config.totalSlots} Claimed ({Math.max(0, config.totalSlots - config.claimedSlots)} Available)
                </span>
              </div>
              <div className="w-full bg-[var(--bg-subtle)] h-1.5 overflow-hidden border border-[var(--border-subtle)]">
                <div
                  className="bg-[var(--text-primary)] h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.round((config.claimedSlots / config.totalSlots) * 100))}%` }}
                />
              </div>

              <button
                onClick={() => {
                  playTactileClick();
                  onRemindMeClick();
                }}
                className="w-full py-2.5 px-3 bg-[var(--bg-subtle)] hover:bg-[var(--bg-card)] border border-[var(--border-main)] hover:border-[var(--text-primary)] text-[var(--text-primary)] text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer mt-3"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Add to Calendar (Google / Apple)</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
