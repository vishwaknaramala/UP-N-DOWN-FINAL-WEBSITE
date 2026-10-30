import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  X,
  Check,
  Download,
  ExternalLink,
  Clock,
  MapPin,
  Bell,
  Sparkles,
} from 'lucide-react';
import {
  LAUNCH_EVENT,
  createGoogleCalendarUrl,
  createOutlookWebCalendarUrl,
  downloadICSFile,
} from '../utils/calendar';
import { playTactileClick } from '../utils/audio';
import { BrandLogo } from './BrandLogo';

interface RemindMeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RemindMeModal: React.FC<RemindMeModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleGoogleCalendar = () => {
    playTactileClick();
    const url = createGoogleCalendarUrl(LAUNCH_EVENT);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleOutlookCalendar = () => {
    playTactileClick();
    const url = createOutlookWebCalendarUrl(LAUNCH_EVENT);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleAppleICal = () => {
    playTactileClick();
    downloadICSFile(LAUNCH_EVENT, 'UP_N_DOWN_LAUNCH_31DEC.ics');
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleCopyDetails = () => {
    playTactileClick();
    const text = `${LAUNCH_EVENT.title}\nDate: 31st Dec 2026\nRoster: Baseball Cap, Denim Loose Pant, Heavy Tees\nSlots: Strictly 100 slots only\nLocation: ${LAUNCH_EVENT.location}\nInstagram: @upndown.ofc\nOfficial Store Email: upndownofficialstore@gmail.com\n${LAUNCH_EVENT.description}`;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="remind-me-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2.5 sm:p-4 overflow-y-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="bg-[var(--bg-card)] border border-[var(--border-main)] max-w-lg w-full p-4 sm:p-8 space-y-5 sm:space-y-6 shadow-2xl relative select-none max-h-[94vh] overflow-y-auto transition-colors"
          >
            {/* Corner decorative ticks */}
            <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-[var(--text-primary)]" />
            <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-[var(--text-primary)]" />
            <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-[var(--text-primary)]" />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-[var(--text-primary)]" />

            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[var(--border-subtle)] pb-4">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <BrandLogo size={26} />
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-[var(--text-muted)]">
                    UP N DOWN · OFFICIAL LAUNCH ALERT
                  </div>
                  <h3 id="remind-me-title" className="text-lg sm:text-xl font-black text-[var(--text-primary)] uppercase font-display tracking-tight mt-0.5">
                    REMIND ME · ADD TO CALENDAR
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

            {/* Event Preview Card */}
            <div className="bg-[var(--bg-subtle)] border border-[var(--border-main)] p-3.5 sm:p-4 space-y-2.5 sm:space-y-3 font-mono text-xs transition-colors">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                <span className="text-[var(--text-primary)] font-bold text-xs sm:text-sm">UP N DOWN // DROP 01</span>
                <span className="text-emerald-400 text-[10px] sm:text-[11px] font-bold">31ST DEC 2026</span>
              </div>

              <div className="space-y-1.5 text-[var(--text-secondary)]">
                <div className="flex items-center gap-2 text-[11px] sm:text-xs">
                  <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                  <span>Release: 31st Dec 2026</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] sm:text-xs">
                  <Clock className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                  <span>Member Early Access: 2 Hours Prior to Public Drop</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] sm:text-xs">
                  <MapPin className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                  <span className="truncate">Global Drop · Instagram @upndown.ofc</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-subtle)]">
                  <Sparkles className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                  <span>Roster: Baseball Cap · Denim Loose Pant · Heavy Tees (100 Slots Only)</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-[var(--text-muted)] pt-1">
                  <Bell className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                  <span>Includes built-in alarms before launch</span>
                </div>
              </div>
            </div>

            {/* Calendar Provider Options */}
            <div className="space-y-2.5">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] block">
                Select Your Calendar Service:
              </span>

              {/* Google Calendar */}
              <button
                onClick={handleGoogleCalendar}
                className="w-full py-2.5 sm:py-3 px-3.5 sm:px-4 bg-[var(--bg-subtle)] border border-[var(--border-main)] hover:border-[var(--border-strong)] transition-all flex items-center justify-between text-xs font-mono text-[var(--text-primary)] cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <span className="w-2 h-2 bg-[#4285F4] rounded-full shrink-0" />
                  <span className="font-bold tracking-wider uppercase text-[11px] sm:text-xs">Google Calendar (Drop Alert)</span>
                </div>
                <ExternalLink className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors shrink-0" />
              </button>

              {/* Apple Calendar / iCal (.ics) */}
              <button
                onClick={handleAppleICal}
                className="w-full py-2.5 sm:py-3 px-3.5 sm:px-4 bg-[var(--bg-subtle)] border border-[var(--border-main)] hover:border-[var(--border-strong)] transition-all flex items-center justify-between text-xs font-mono text-[var(--text-primary)] cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <span className="w-2 h-2 bg-[var(--text-primary)] rounded-full shrink-0" />
                  <span className="font-bold tracking-wider uppercase text-[11px] sm:text-xs">Apple Calendar / iCal (.ics)</span>
                </div>
                <Download className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors shrink-0" />
              </button>

              {/* Outlook.com Web */}
              <button
                onClick={handleOutlookCalendar}
                className="w-full py-2.5 sm:py-3 px-3.5 sm:px-4 bg-[var(--bg-subtle)] border border-[var(--border-main)] hover:border-[var(--border-strong)] transition-all flex items-center justify-between text-xs font-mono text-[var(--text-primary)] cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <span className="w-2 h-2 bg-[#0078D4] rounded-full shrink-0" />
                  <span className="font-bold tracking-wider uppercase text-[11px] sm:text-xs">Outlook Web Calendar</span>
                </div>
                <ExternalLink className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors shrink-0" />
              </button>
            </div>

            {/* Copy Details directly */}
            <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <button
                onClick={handleCopyDetails}
                className="text-xs font-mono uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center sm:justify-start gap-1.5 transition-colors cursor-pointer py-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{copied ? 'Launch Details Copied' : 'Copy Launch Event Details'}</span>
              </button>

              {downloadSuccess && (
                <span className="text-[11px] font-mono text-emerald-400 text-center sm:text-right">
                  ✓ .ics downloaded
                </span>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
