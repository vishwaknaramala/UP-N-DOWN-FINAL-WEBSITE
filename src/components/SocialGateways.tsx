import React, { useState } from 'react';
import { motion, type Variants } from 'motion/react';
import { ExternalLink, Copy, Check, Instagram, Sparkles, ShieldCheck, Mail, Send } from 'lucide-react';
import { playTactileClick } from '../utils/audio';

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
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export const SocialGateways: React.FC = () => {
  const [copiedHandle, setCopiedHandle] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyHandle = () => {
    playTactileClick();
    navigator.clipboard.writeText('@upndown.ofc').catch(() => {});
    setCopiedHandle(true);
    setTimeout(() => setCopiedHandle(false), 2000);
  };

  const handleCopyEmail = () => {
    playTactileClick();
    navigator.clipboard.writeText('upndownofficialstore@gmail.com').catch(() => {});
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 max-w-7xl mx-auto border-b border-[var(--border-main)] transition-colors">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-12"
      >
        <div>
          <div className="text-xs font-mono uppercase tracking-[0.25em] text-[var(--text-muted)] mb-2">
            05. VERIFIED OFFICIAL CHANNELS
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[var(--text-primary)] uppercase font-display tracking-tight">
            CONNECT WITH THE ARCHIVE
          </h2>
          <p className="text-[var(--text-secondary)] mt-2 max-w-xl text-sm sm:text-base font-light">
            Stay in sync with official visual drops on Instagram and reach our dispatch concierge directly via official email.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
          <div className="bg-[var(--bg-subtle)] border border-[var(--border-main)] px-3 py-1.5 flex items-center gap-2">
            <span className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" />
            <span>@upndown.ofc</span>
          </div>
          <div className="bg-[var(--bg-subtle)] border border-[var(--border-main)] px-3 py-1.5 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span>upndownofficialstore@gmail.com</span>
          </div>
        </div>
      </motion.div>

      {/* Grid of 2 High-Impact Cards: Instagram + Official Store Email */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Card 1: Instagram Official */}
        <motion.div
          variants={itemVariants}
          className="bg-[var(--bg-card)] border border-[var(--border-main)] p-5 sm:p-8 relative overflow-hidden group hover:border-[var(--border-strong)] transition-colors shadow-2xl flex flex-col justify-between"
        >
          {/* Ambient background glow */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-gradient-to-br from-pink-600/10 via-purple-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

          {/* Corner ticks */}
          <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-[var(--text-primary)]" />
          <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-[var(--text-primary)]" />
          <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-[var(--text-primary)]" />
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-[var(--text-primary)]" />

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-[var(--bg-subtle)] border border-[var(--border-main)] flex items-center justify-center text-[var(--text-primary)] shadow-lg shrink-0">
                <Instagram className="w-5 h-5 text-pink-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg sm:text-xl font-black text-[var(--text-primary)] font-display uppercase tracking-tight">
                    UP N DOWN OFFICIAL
                  </span>
                  <span className="px-1.5 py-0.5 bg-[var(--bg-subtle)] text-[var(--text-secondary)] font-mono text-[9px] uppercase font-bold border border-[var(--border-subtle)]">
                    Verified
                  </span>
                </div>
                <div className="font-mono text-xs sm:text-sm text-[var(--text-secondary)] font-bold tracking-wider">
                  @upndown.ofc
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-light leading-relaxed">
              Our single verified broadcast destination. Follow for direct drop notifications, runway fit cuts, and behind-the-scenes pattern drafting.
            </p>

            <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-[var(--text-muted)] pt-1">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span>31st Dec 2026</span>
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sole Verified Handle</span>
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-6 mt-4 border-t border-[var(--border-subtle)]">
            <a
              href="https://instagram.com/upndown.ofc"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playTactileClick()}
              className="py-3 px-4 bg-[var(--btn-bg)] hover:opacity-90 text-[var(--btn-text)] font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl cursor-pointer"
            >
              <span>Follow @upndown.ofc</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={handleCopyHandle}
              className="py-3 px-4 bg-[var(--bg-subtle)] border border-[var(--border-main)] hover:border-[var(--text-primary)] text-[var(--text-primary)] font-mono text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {copiedHandle ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Handle Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <span>Copy @upndown.ofc</span>
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Card 2: Official Store Email Gateway */}
        <motion.div
          variants={itemVariants}
          className="bg-[var(--bg-card)] border border-[var(--border-main)] p-5 sm:p-8 relative overflow-hidden group hover:border-[var(--border-strong)] transition-colors shadow-2xl flex flex-col justify-between"
        >
          {/* Ambient background glow */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-gradient-to-br from-emerald-600/10 via-cyan-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

          {/* Corner ticks */}
          <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-[var(--text-primary)]" />
          <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-[var(--text-primary)]" />
          <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-[var(--text-primary)]" />
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-[var(--text-primary)]" />

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-[var(--bg-subtle)] border border-[var(--border-main)] flex items-center justify-center text-[var(--text-primary)] shadow-lg shrink-0">
                <Mail className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg sm:text-xl font-black text-[var(--text-primary)] font-display uppercase tracking-tight">
                    OFFICIAL STORE DESK
                  </span>
                  <span className="px-1.5 py-0.5 bg-emerald-950/60 text-emerald-300 font-mono text-[9px] uppercase font-bold border border-emerald-500/40">
                    Official
                  </span>
                </div>
                <div className="font-mono text-xs sm:text-sm text-[var(--text-secondary)] font-bold tracking-wider break-all">
                  upndownofficialstore@gmail.com
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-light leading-relaxed">
              Direct point of contact for customer care, VIP club pass allocations, wholesale press inquiries, and official order management.
            </p>

            <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-[var(--text-muted)] pt-1">
              <span className="flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span>Response Time &lt; 24h</span>
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Single Verified Store Mail</span>
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-6 mt-4 border-t border-[var(--border-subtle)]">
            <a
              href="mailto:upndownofficialstore@gmail.com"
              onClick={() => playTactileClick()}
              className="py-3 px-4 bg-[var(--btn-bg)] hover:opacity-90 text-[var(--btn-text)] font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl cursor-pointer"
            >
              <span>Email Store Desk</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={handleCopyEmail}
              className="py-3 px-4 bg-[var(--bg-subtle)] border border-[var(--border-main)] hover:border-[var(--text-primary)] text-[var(--text-primary)] font-mono text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {copiedEmail ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Email Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <span>Copy Store Email</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};
