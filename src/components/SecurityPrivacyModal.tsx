import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, Lock, Cpu, EyeOff, Trash2 } from 'lucide-react';
import { playTactileClick } from '../utils/audio';
import { vibrateWarning } from '../utils/haptics';

interface SecurityPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearData: () => void;
}

export const SecurityPrivacyModal: React.FC<SecurityPrivacyModalProps> = ({
  isOpen,
  onClose,
  onClearData,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2.5 sm:p-4 overflow-y-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="bg-[var(--bg-card)] border border-[var(--border-main)] max-w-2xl w-full p-4 sm:p-8 space-y-5 sm:space-y-6 shadow-2xl relative select-none max-h-[94vh] overflow-y-auto transition-colors"
          >
            <div className="flex items-start justify-between border-b border-[var(--border-subtle)] pb-4">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[var(--text-primary)]" />
                <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] uppercase font-display tracking-tight">
                  Security &amp; Data Privacy Protocol
                </h3>
              </div>
              <button
                onClick={() => {
                  playTactileClick();
                  onClose();
                }}
                className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs font-mono text-[var(--text-secondary)] leading-relaxed max-h-[58vh] overflow-y-auto pr-1">
              <div className="p-3.5 sm:p-4 bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-1.5 transition-colors">
                <div className="flex items-center gap-2 text-[var(--text-primary)] font-bold uppercase text-[11px] sm:text-xs">
                  <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>1. Client-Side Cryptographic Signatures</span>
                </div>
                <p className="text-[var(--text-secondary)] font-sans text-xs font-light">
                  Your Club Membership Pass generates a 256-bit hash using the native browser Web Crypto API (<code className="text-[var(--text-primary)]">window.crypto.subtle.digest(&apos;SHA-256&apos;)</code>). No plaintext passwords or sensitive financial credentials are exchanged.
                </p>
              </div>

              <div className="p-3.5 sm:p-4 bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-1.5 transition-colors">
                <div className="flex items-center gap-2 text-[var(--text-primary)] font-bold uppercase text-[11px] sm:text-xs">
                  <EyeOff className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>2. Zero Advertising Pixels &amp; Trackers</span>
                </div>
                <p className="text-[var(--text-secondary)] font-sans text-xs font-light">
                  This site embeds zero third-party advertising scripts, Facebook/Meta pixels, Google Ad tags, or invasive browser fingerprinting. Your connection and device data remain confidential.
                </p>
              </div>

              <div className="p-3.5 sm:p-4 bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-1.5 transition-colors">
                <div className="flex items-center gap-2 text-[var(--text-primary)] font-bold uppercase text-[11px] sm:text-xs">
                  <Cpu className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>3. Offline Capability &amp; Local Sandbox</span>
                </div>
                <p className="text-[var(--text-secondary)] font-sans text-xs font-light">
                  Using Service Worker caching and local storage isolation, all lookbook schematics, Club passes, and countdown calculations run offline without sending constant telemetry pings.
                </p>
              </div>

              <div className="p-3.5 sm:p-4 bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-1.5 transition-colors">
                <div className="text-[var(--text-primary)] font-bold uppercase text-[11px] sm:text-xs">
                  4. GDPR &amp; CCPA Deletion Right
                </div>
                <p className="text-[var(--text-secondary)] font-sans text-xs font-light">
                  You maintain total sovereign control over your Club pass and stored details. You can erase all local data immediately below.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                onClick={() => {
                  vibrateWarning();
                  playTactileClick();
                  onClearData();
                  onClose();
                }}
                className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-mono text-red-400 hover:text-red-300 hover:underline cursor-pointer py-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Purge Local Club Pass &amp; Cache</span>
              </button>

              <button
                onClick={() => {
                  playTactileClick();
                  onClose();
                }}
                className="w-full sm:w-auto px-6 py-2.5 text-xs font-mono uppercase tracking-wider text-[var(--btn-text)] bg-[var(--btn-bg)] hover:opacity-90 transition-opacity font-bold cursor-pointer text-center shadow-md"
              >
                Acknowledge &amp; Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
