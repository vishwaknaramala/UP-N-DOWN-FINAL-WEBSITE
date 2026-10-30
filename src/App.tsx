import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroCountdown } from './components/HeroCountdown';
import { CollectionLookbook } from './components/CollectionLookbook';
import { ReloadPreloader } from './components/ReloadPreloader';
import { VipConfettiCanvas } from './components/VipConfettiCanvas';
import { DropPrediction } from './components/DropPrediction';
import { WaitlistSection } from './components/WaitlistSection';
import { SocialGateways } from './components/SocialGateways';
import { SecurityPrivacyModal } from './components/SecurityPrivacyModal';
import { RemindMeModal } from './components/RemindMeModal';
import { ClubEmailConfirmationModal } from './components/ClubEmailConfirmationModal';
import { PaletteSwitcher } from './components/PaletteSwitcher';
import { applyPaletteCSS, getStoredPalette } from './utils/themePalettes';
import { Footer } from './components/Footer';
import { DeveloperAdminPortal } from './components/DeveloperAdminPortal';
import { ThreeDLogoRoadCanvas } from './components/ThreeDLogoRoadCanvas';
import { OurStory } from './components/OurStory';
import { ScrollProgress } from './components/ScrollProgress';
import { usePWA } from './hooks/usePWA';
import { getStoredVipPass } from './utils/crypto';
import { isSoundEnabled, setSoundEnabled, playTactileClick } from './utils/audio';
import { vibrateModalOpen } from './utils/haptics';
import { WaitlistSubmission, GarmentItem } from './types';
import { WifiOff, Download, Smartphone, X } from 'lucide-react';

export default function App() {
  const { isInstallable, isInstalled, isIOS, isOnline, installPWA } = usePWA();
  const [vipPass, setVipPass] = useState<WaitlistSubmission | null>(null);
  const [preSelectedProduct, setPreSelectedProduct] = useState<{ product: GarmentItem; size: string } | null>(null);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [remindModalOpen, setRemindModalOpen] = useState(false);
  const [emailConfirmModalOpen, setEmailConfirmModalOpen] = useState(false);
  const [developerPortalOpen, setDeveloperPortalOpen] = useState(false);
  const [soundActive, setSoundActiveState] = useState(true);
  const [showIOSInstallGuide, setShowIOSInstallGuide] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [confettiTrigger, setConfettiTrigger] = useState(0);

  useEffect(() => {
    applyPaletteCSS(getStoredPalette());
    const existing = getStoredVipPass();
    if (existing) {
      setVipPass(existing);
    }
    setSoundActiveState(isSoundEnabled());
  }, []);

  const handleToggleSound = () => {
    const next = !soundActive;
    setSoundEnabled(next);
    setSoundActiveState(next);
    if (next) playTactileClick();
  };

  const scrollToWaitlist = () => {
    const element = document.getElementById('waitlist');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToRunway = () => {
    const element = document.getElementById('3d-runway');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToCollection = () => {
    const element = document.getElementById('collection');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePreReserve = (product: GarmentItem, size: string) => {
    setPreSelectedProduct({ product, size });
    scrollToWaitlist();
  };

  const handleOpenRemindModal = () => {
    vibrateModalOpen();
    setRemindModalOpen(true);
  };

  const handleOpenPrivacyModal = () => {
    vibrateModalOpen();
    setPrivacyModalOpen(true);
  };

  const handleOpenEmailConfirmModal = () => {
    vibrateModalOpen();
    setEmailConfirmModalOpen(true);
  };

  const handleOpenIOSGuide = () => {
    vibrateModalOpen();
    setShowIOSInstallGuide(true);
  };

  const handleClearData = () => {
    try {
      localStorage.removeItem('upndown_club_pass_v1');
      localStorage.removeItem('void_archive_vip_pass_v1');
      localStorage.removeItem('upndown_prediction_vote_v1');
      localStorage.removeItem('upndown_prediction_vote_v2');
      localStorage.removeItem('void_archive_prediction_vote_v1');
    } catch (e) {
      // Non-fatal
    }
    setVipPass(null);
    setPreSelectedProduct(null);
  };

  return (
    <div id="top" className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] flex flex-col font-sans selection:bg-[var(--text-primary)] selection:text-[var(--bg-main)] transition-colors duration-300">
      {/* Subtle Luxury Canvas Confetti Triggered Only on VIP Waitlist Registration */}
      <VipConfettiCanvas triggerCount={confettiTrigger} />

      {/* High-Impact Reload / Decrypt Preloader Animation */}
      <ReloadPreloader forceTrigger={reloadTrigger} />

      {/* Global Scroll-Progress Indicator using Framer Motion */}
      <ScrollProgress />

      {/* Offline Status Alert Pill */}
      {!isOnline && (
        <aside
          aria-label="Offline status"
          className="bg-zinc-900 border-b border-zinc-700 py-2 px-4 text-xs font-mono text-zinc-300 flex items-center justify-center gap-2 sticky top-0 z-50 backdrop-blur-sm"
        >
          <WifiOff className="w-4 h-4 text-amber-400" />
          <span>Offline Mode Active — Local cached catalog and Club passes remain fully functional.</span>
        </aside>
      )}

      {/* Top Navigation */}
      <Navbar
        onJoinWaitlistClick={scrollToWaitlist}
        hasVipPass={!!vipPass}
        onViewVipPass={scrollToWaitlist}
        onReloadVault={() => setReloadTrigger((prev) => prev + 1)}
        onOpenDeveloperPortal={() => setDeveloperPortalOpen(true)}
      />

      <main className="flex-1">
        {/* Hero & Live Launch Countdown to 31st Dec 2026 at 18:00 IST */}
        <HeroCountdown
          onJoinClick={scrollToWaitlist}
          onExploreClick={scrollToCollection}
          onRunwayClick={scrollToRunway}
          onRemindMeClick={handleOpenRemindModal}
          hasPass={!!vipPass}
        />

        {/* 3D Runway Road & 3D Logo Monogram Interactive Section */}
        <div id="3d-runway">
          <ThreeDLogoRoadCanvas />
        </div>

        {/* Brand Narrative: Our Story | Est. 2026 */}
        <OurStory />

        {/* Categories & Interactive Lookbook with Classified Vault Embargo */}
        <CollectionLookbook
          onPreReserve={handlePreReserve}
        />

        {/* Drop Prediction Poll & Priority Queue */}
        <DropPrediction onPredictComplete={scrollToWaitlist} />

        {/* Join The Club — Early Access & Cryptographic Club Pass Generator */}
        <WaitlistSection
          preSelectedProduct={preSelectedProduct}
          vipPass={vipPass}
          onPassGenerated={(newPass) => {
            setVipPass(newPass);
            setConfettiTrigger((prev) => prev + 1);
            setEmailConfirmModalOpen(false);
          }}
          onOpenPrivacyModal={handleOpenPrivacyModal}
          onOpenCalendarModal={handleOpenRemindModal}
          onOpenEmailConfirmation={handleOpenEmailConfirmModal}
        />

        {/* Verified Social Media Gateways — Instagram @upndown.ofc Exclusive */}
        <SocialGateways />
      </main>

      {/* Club Mail Confirmation Modal */}
      <ClubEmailConfirmationModal
        isOpen={emailConfirmModalOpen}
        onClose={() => setEmailConfirmModalOpen(false)}
        vipPass={vipPass}
      />

      {/* Remind Me / Calendar Modal (18:00 IST) */}
      <RemindMeModal
        isOpen={remindModalOpen}
        onClose={() => setRemindModalOpen(false)}
      />

      {/* Security & Privacy Modal */}
      <SecurityPrivacyModal
        isOpen={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
        onClearData={handleClearData}
      />

      {/* iOS Guided Install Modal */}
      {showIOSInstallGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-main)] max-w-sm w-full p-5 sm:p-6 space-y-4 shadow-2xl transition-colors">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[var(--text-primary)]" />
                <h3 className="text-sm font-bold uppercase font-display text-[var(--text-primary)]">Install on iOS Safari</h3>
              </div>
              <button
                onClick={() => setShowIOSInstallGuide(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs text-[var(--text-secondary)] font-mono space-y-2 leading-relaxed">
              <p>1. Tap the <strong className="text-[var(--text-primary)]">Share</strong> icon at the bottom of Safari.</p>
              <p>2. Scroll down and tap <strong className="text-[var(--text-primary)]">Add to Home Screen</strong>.</p>
              <p>3. Launch UP N DOWN directly from your home screen for instant offline access.</p>
            </div>
            <button
              onClick={() => setShowIOSInstallGuide(false)}
              className="w-full py-2.5 bg-[var(--btn-bg)] hover:opacity-90 text-[var(--btn-text)] font-mono text-xs uppercase tracking-wider font-bold transition-opacity cursor-pointer shadow-md"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Floating In-App PWA Install Badge if installable */}
      {isInstallable && !isInstalled && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40">
          <button
            onClick={() => {
              playTactileClick();
              installPWA();
            }}
            className="flex items-center gap-2 bg-[var(--btn-bg)] hover:opacity-90 text-[var(--btn-text)] px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs font-mono uppercase tracking-wider font-bold shadow-2xl transition-transform active:scale-95 cursor-pointer border border-[var(--border-main)]"
          >
            <Download className="w-4 h-4" />
            <span>Install App</span>
          </button>
        </div>
      )}

      {/* Footer */}
      <Footer
        onOpenPrivacy={handleOpenPrivacyModal}
        onOpenDeveloperPortal={() => setDeveloperPortalOpen(true)}
        isInstallable={isInstallable || isIOS}
        onInstall={() => {
          if (isIOS) handleOpenIOSGuide();
          else installPWA();
        }}
        isOnline={isOnline}
        soundActive={soundActive}
        onToggleSound={handleToggleSound}
      />

      {/* Developer & Atelier Admin Portal */}
      <DeveloperAdminPortal
        isOpen={developerPortalOpen}
        onClose={() => setDeveloperPortalOpen(false)}
      />
    </div>
  );
}
