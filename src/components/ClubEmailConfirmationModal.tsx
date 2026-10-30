import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail,
  CheckCircle2,
  X,
  Copy,
  Check,
  Calendar,
  Sparkles,
  ShieldCheck,
  Send,
  ExternalLink,
} from 'lucide-react';
import { WaitlistSubmission } from '../types';
import { BrandLogo } from './BrandLogo';
import { playTactileClick } from '../utils/audio';
import { downloadICSFile, LAUNCH_EVENT } from '../utils/calendar';
import { resendMemberEmail } from '../forms/clubMemberAllocation';

interface ClubEmailConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  vipPass: WaitlistSubmission | null;
}

export const ClubEmailConfirmationModal: React.FC<ClubEmailConfirmationModalProps> = ({
  isOpen,
  onClose,
  vipPass,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [resentStatus, setResentStatus] = useState<string | null>(null);

  const handleCopyCode = () => {
    if (!vipPass) return;
    playTactileClick();
    navigator.clipboard.writeText(vipPass.passCode).catch(() => {});
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleResend = async () => {
    if (!vipPass) return;
    playTactileClick();
    setResentStatus(`Dispatched live confirmation email to ${vipPass.email}...`);
    await resendMemberEmail(vipPass.id);
    setResentStatus(`✓ Live email successfully dispatched to ${vipPass.email} at ${new Date().toLocaleTimeString()}`);
    setTimeout(() => setResentStatus(null), 5000);
  };

  const handleDownloadCalendar = () => {
    playTactileClick();
    downloadICSFile(LAUNCH_EVENT, 'UP_N_DOWN_LAUNCH_31DEC.ics');
  };

  return (
    <AnimatePresence>
      {isOpen && vipPass && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="email-confirm-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2.5 sm:p-4 overflow-y-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="bg-[var(--bg-card)] border border-[var(--border-main)] max-w-2xl w-full p-4 sm:p-8 space-y-5 sm:space-y-6 shadow-2xl relative select-none max-h-[94vh] overflow-y-auto transition-colors"
          >
            {/* Corner ticks */}
            <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-[var(--text-primary)]" />
            <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-[var(--text-primary)]" />
            <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-[var(--text-primary)]" />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-[var(--text-primary)]" />

            {/* Top Header */}
            <div className="flex items-start justify-between border-b border-[var(--border-subtle)] pb-4">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[var(--bg-subtle)] border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.2em] sm:tracking-[0.25em] text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>CONFIRMATION EMAIL DISPATCHED</span>
                  </div>
                  <h3 id="email-confirm-title" className="text-lg sm:text-2xl font-black text-[var(--text-primary)] uppercase font-display tracking-tight mt-0.5">
                    CLUB ACCESS CONFIRMED
                  </h3>
                </div>
              </div>
              <button
                onClick={() => {
                  playTactileClick();
                  onClose();
                }}
                className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Simulated Email Envelope & Preview Card */}
            <div className="bg-[var(--bg-subtle)] border border-[var(--border-main)] overflow-hidden transition-colors">
              {/* Email client header metadata */}
              <div className="bg-[var(--bg-main)] px-3 sm:px-4 py-2.5 sm:py-3 border-b border-[var(--border-subtle)] text-[11px] sm:text-xs font-mono space-y-1">
                <div className="flex justify-between items-center text-[var(--text-muted)]">
                  <span><strong>From:</strong> UP N DOWN Atelier &lt;onboarding@resend.dev&gt; (via Resend)</span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 border border-emerald-500/30">Priority Relay</span>
                </div>
                <div className="text-[var(--text-secondary)] flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <strong>To:</strong>{' '}
                    <span className="text-[var(--text-primary)] font-bold">
                      {vipPass.name ? `${vipPass.name} <${vipPass.email}>` : vipPass.email}
                    </span>
                  </div>
                  <a
                    href={`https://mail.google.com/mail/u/0/#search/${encodeURIComponent(vipPass.email)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-blue-400 hover:text-blue-300 underline flex items-center gap-1"
                  >
                    <span>Open in Gmail</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <div className="text-[var(--text-muted)] truncate">
                  <strong>Subject:</strong> UP N DOWN — CLUB ACCESS GRANTED [SLOT #{vipPass.positionNumber.toString().padStart(2, '0')} / 100]
                </div>
                <div className="text-[10px] text-[var(--text-muted)] flex flex-wrap items-center justify-between gap-1 pt-1 border-t border-[var(--border-subtle)]">
                  <span>Owner Alert Dispatched to: <strong className="text-[var(--text-primary)]">vishwaknaramala@gmail.com</strong></span>
                  <span className="text-emerald-400 font-bold">✓ Dual Delivery Active</span>
                </div>
              </div>

              {/* Email Body Content */}
              <div className="p-4 sm:p-8 space-y-5 sm:space-y-6 text-[var(--text-secondary)]">
                {/* Brand Logo & Lockup */}
                <div className="flex flex-col items-center justify-center text-center space-y-1.5 sm:space-y-2 pb-5 sm:pb-6 border-b border-[var(--border-subtle)]">
                  <BrandLogo size={36} showStarGlow />
                  <div className="font-display font-black text-xl sm:text-2xl tracking-[0.2em] text-[var(--text-primary)] uppercase">
                    UP N DOWN
                  </div>
                  <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.3em] text-[var(--text-muted)]">
                    SAME ENERGY DIFFERENT PHASE
                  </div>
                </div>

                {/* Main Greeting & Status */}
                <div className="space-y-2.5 sm:space-y-3">
                  <div className="inline-block px-2.5 sm:px-3 py-1 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider">
                    ✓ Guaranteed Member Slot #{vipPass.positionNumber} / 100 Secured
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-[var(--text-primary)] uppercase font-display">
                    Welcome to The Club. Your allocation is confirmed.
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] font-light leading-relaxed">
                    Thank you for joining the UP N DOWN inner circle. Because this launch is strictly capped at 100 slots total, your allocation has been cryptographically recorded into our Drop 01 ledger.
                  </p>
                </div>

                {/* Official Passcode Callout */}
                <div className="bg-[var(--bg-main)] border border-[var(--border-main)] p-4 sm:p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
                      SECRET ACCESS PASSCODE
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-mono text-[var(--text-muted)]">
                      100 SLOTS ONLY
                    </span>
                  </div>
                  <div className="text-xl sm:text-3xl font-mono font-black text-[var(--text-primary)] tracking-widest break-all">
                    {vipPass.passCode}
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-mono text-[var(--text-secondary)] flex items-center justify-between pt-1 border-t border-[var(--border-subtle)]">
                    <span>Target Sizing: <strong className="text-[var(--text-primary)]">{vipPass.sizePreference}</strong></span>
                    <button
                      onClick={handleCopyCode}
                      className="text-[var(--text-primary)] hover:opacity-80 flex items-center gap-1 cursor-pointer font-bold transition-opacity"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                    </button>
                  </div>
                </div>

                {/* Launch Timing */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs font-mono bg-[var(--bg-main)] p-3 sm:p-4 border border-[var(--border-subtle)]">
                  <div>
                    <span className="text-[var(--text-muted)] block text-[10px] uppercase">CLUB MEMBER PRIVATE WINDOW</span>
                    <span className="text-[var(--text-primary)] font-bold text-sm">31st Dec 2026</span>
                    <span className="text-[var(--text-muted)] block text-[10px] mt-0.5">(2 Hours Early Checkout)</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] block text-[10px] uppercase">LAUNCH STATUS</span>
                    <span className="text-[var(--text-primary)] font-bold text-sm">31st Dec 2026</span>
                    <span className="text-[var(--text-muted)] block text-[10px] mt-0.5">(Exclusive 100 Member Slots)</span>
                  </div>
                </div>

                {/* Collection Roster (No prices) */}
                <div className="space-y-2">
                  <span className="text-xs font-mono uppercase tracking-widest text-[var(--text-muted)] block">
                    Drop 01 Guaranteed Allocation Roster:
                  </span>
                  <div className="space-y-1.5 text-xs font-mono text-[var(--text-secondary)]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 bg-[var(--bg-main)] border border-[var(--border-subtle)]">
                      <span>01. Baseball Cap (420 GSM 6-Panel Twill)</span>
                      <span className="text-emerald-400 font-bold text-[11px] sm:text-xs">Guaranteed Allocation</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 bg-[var(--bg-main)] border border-[var(--border-subtle)]">
                      <span>02. Denim Loose Pant (14.5 oz Raw Rigid Selvedge)</span>
                      <span className="text-emerald-400 font-bold text-[11px] sm:text-xs">Guaranteed Allocation</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 bg-[var(--bg-main)] border border-[var(--border-subtle)]">
                      <span>03. Heavy Tees (320 GSM Dense Mock Collar)</span>
                      <span className="text-emerald-400 font-bold text-[11px] sm:text-xs">Guaranteed Allocation</span>
                    </div>
                  </div>
                </div>

                {/* Cryptographic verification fingerprint & official support contact */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] font-mono text-[var(--text-muted)] pt-2 border-t border-[var(--border-subtle)]">
                  <div className="flex items-center gap-2 truncate">
                    <ShieldCheck className="w-3.5 h-3.5 text-[var(--text-secondary)] shrink-0" />
                    <span className="truncate">
                      SHA-256 Ledger Signature: {vipPass.cryptoSignature.substring(0, 32)}...
                    </span>
                  </div>
                  <div className="text-[10px]">
                    Desk: <a href="mailto:upndownofficialstore@gmail.com" className="text-[var(--text-primary)] hover:underline font-bold">upndownofficialstore@gmail.com</a>
                  </div>
                </div>
              </div>
            </div>

            {/* Resent notice if triggered */}
            {resentStatus && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-700 text-xs font-mono text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{resentStatus}</span>
              </div>
            )}

            {/* Modal Bottom Actions: Mobile Stacking for Perfect Fit */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-[var(--border-subtle)]">
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleResend}
                  className="py-2.5 px-3 bg-[var(--bg-subtle)] border border-[var(--border-main)] hover:border-[var(--border-strong)] text-xs font-mono text-[var(--text-primary)] flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Resend Email</span>
                </button>
                <button
                  onClick={handleDownloadCalendar}
                  className="py-2.5 px-3 bg-[var(--bg-subtle)] border border-[var(--border-main)] hover:border-[var(--border-strong)] text-xs font-mono text-[var(--text-primary)] flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Save .ics</span>
                </button>
              </div>

              <button
                onClick={() => {
                  playTactileClick();
                  onClose();
                }}
                className="w-full sm:w-auto py-2.5 px-6 bg-[var(--btn-bg)] hover:opacity-90 text-[var(--btn-text)] font-mono font-bold text-xs uppercase tracking-wider transition-opacity cursor-pointer text-center shadow-lg"
              >
                Done · Return to Drop
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
