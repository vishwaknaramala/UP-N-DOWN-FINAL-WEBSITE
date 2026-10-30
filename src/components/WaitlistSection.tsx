import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { WaitlistSubmission, GarmentItem } from '../types';
import { generateICSLaunchInvite, downloadFile } from '../utils/crypto';
import { playTactileClick, playPassRevealSound } from '../utils/audio';
import { Shield, Lock, CheckCircle2, Download, Calendar, Copy, Check, ArrowRight, Sparkles, Mail, X, Ticket } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { allocateNewClubMember } from '../forms/clubMemberAllocation';
import { getStoredConfig, DEVELOPER_DATA_UPDATED } from '../utils/developerStorage';

interface WaitlistSectionProps {
  preSelectedProduct?: { product: GarmentItem; size: string } | null;
  vipPass: WaitlistSubmission | null;
  onPassGenerated: (pass: WaitlistSubmission) => void;
  onOpenPrivacyModal: () => void;
  onOpenCalendarModal?: () => void;
  onOpenEmailConfirmation?: () => void;
}

export const WaitlistSection: React.FC<WaitlistSectionProps> = ({
  preSelectedProduct,
  vipPass,
  onPassGenerated,
  onOpenPrivacyModal,
  onOpenCalendarModal,
  onOpenEmailConfirmation,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [tshirtSize, setTshirtSize] = useState('M (Oversized)');
  const [pantSize, setPantSize] = useState('32 (Wide)');
  const [capSize, setCapSize] = useState('One Size (Adjustable)');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'Baseball Cap',
    'Denim Loose Pant',
    'Heavy Tees',
  ]);
  const [privacyConsent, setPrivacyConsent] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [config, setConfig] = useState(getStoredConfig());
  const [successNotification, setSuccessNotification] = useState<{
    passCode: string;
    slotNum: number;
    email: string;
    name?: string;
  } | null>(null);
  const [viewMode, setViewMode] = useState<'form' | 'pass'>('form');

  // Sizing Options per Garment Category
  const TSHIRT_SIZES = [
    { label: 'S (Relaxed)', short: 'S', spec: 'Chest 56cm · Drop Shoulder' },
    { label: 'M (Oversized)', short: 'M', spec: 'Chest 60cm · Signature Boxy' },
    { label: 'L (Baggy)', short: 'L', spec: 'Chest 64cm · Heavy Drape' },
    { label: 'XL (Boxy)', short: 'XL', spec: 'Chest 68cm · Runway Cut' },
    { label: 'XXL (Heavy Boxy)', short: 'XXL', spec: 'Chest 72cm · Architectural' },
  ];

  const PANT_SIZES = [
    { label: '28 (Slim Loose)', short: '28', spec: 'Waist 76cm · 20" Leg Sweep' },
    { label: '30 (Loose)', short: '30', spec: 'Waist 81cm · 21" Leg Sweep' },
    { label: '32 (Wide)', short: '32', spec: 'Waist 86cm · 22" Leg Sweep' },
    { label: '34 (Baggy)', short: '34', spec: 'Waist 91cm · 23" Leg Sweep' },
    { label: '36 (Skate Fit)', short: '36', spec: 'Waist 96cm · 24" Leg Sweep' },
    { label: '38 (Extra Wide)', short: '38', spec: 'Waist 101cm · 25" Leg Sweep' },
  ];

  const CAP_SIZES = [
    { label: 'One Size (Adjustable)', short: 'OS', spec: 'Strapback · 56-61 cm Circumference' },
    { label: 'Fitted S/M', short: 'S/M', spec: '56-58 cm Contour Profile' },
    { label: 'Fitted L/XL', short: 'L/XL', spec: '59-62 cm Deep Crown' },
  ];

  useEffect(() => {
    const handleUpdate = () => {
      setConfig(getStoredConfig());
    };
    window.addEventListener(DEVELOPER_DATA_UPDATED, handleUpdate);
    return () => window.removeEventListener(DEVELOPER_DATA_UPDATED, handleUpdate);
  }, []);

  const passCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // If a user pre-selected a product in the lookbook, update the respective garment sizing
  useEffect(() => {
    if (preSelectedProduct) {
      const cat = preSelectedProduct.product.category;
      const sz = preSelectedProduct.size;
      if (cat === 'tshirts') {
        const match = TSHIRT_SIZES.find((s) => s.short === sz || s.label.startsWith(sz))?.label || sz;
        setTshirtSize(match);
      } else if (cat === 'pants') {
        const match = PANT_SIZES.find((s) => s.short === sz || s.label.startsWith(sz))?.label || sz;
        setPantSize(match);
      } else if (cat === 'caps') {
        const match = CAP_SIZES.find((s) => s.short === sz || s.label.startsWith(sz))?.label || sz;
        setCapSize(match);
      }
      if (!selectedCategories.includes(preSelectedProduct.product.categoryLabel)) {
        setSelectedCategories((prev) => [...prev, preSelectedProduct.product.categoryLabel]);
      }
    }
  }, [preSelectedProduct]);

  // Draw dynamic QR Code on canvas when VIP pass is active
  useEffect(() => {
    if (!vipPass || !passCanvasRef.current) return;
    const canvas = passCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 140;
    canvas.height = 140;

    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, 140, 140);

    const hash = vipPass.cryptoSignature || 'UPNDOWN2026';
    const gridSize = 14;
    const cellSize = 140 / gridSize;

    ctx.fillStyle = '#ffffff';

    const drawFinder = (x: number, y: number) => {
      ctx.fillRect(x * cellSize, y * cellSize, 3 * cellSize, 3 * cellSize);
      ctx.fillStyle = '#09090b';
      ctx.fillRect((x + 0.75) * cellSize, (y + 0.75) * cellSize, 1.5 * cellSize, 1.5 * cellSize);
      ctx.fillStyle = '#ffffff';
    };

    drawFinder(1, 1);
    drawFinder(10, 1);
    drawFinder(1, 10);

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if ((r < 4 && c < 4) || (r < 4 && c > 9) || (r > 9 && c < 4)) continue;
        const charCode = hash.charCodeAt((r * gridSize + c) % hash.length);
        if (charCode % 2 === 0) {
          ctx.fillRect(c * cellSize + 1, r * cellSize + 1, cellSize - 2, cellSize - 2);
        }
      }
    }
  }, [vipPass, viewMode]);

  const toggleCategory = (cat: string) => {
    playTactileClick();
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length > 1) {
        setSelectedCategories(selectedCategories.filter((c) => c !== cat));
      }
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!privacyConsent) {
      setErrorMessage('Please accept the membership terms to proceed.');
      return;
    }

    setIsSubmitting(true);
    playTactileClick();

    try {
      const compositeSizePreference = `Tee: ${tshirtSize.split(' ')[0]} · Pant: ${pantSize.split(' ')[0]} · Cap: ${capSize.includes('One Size') ? 'OS' : capSize.split(' ')[0]}`;
      const { member } = await allocateNewClubMember({
        name: name.trim(),
        email: cleanEmail,
        phone: phone.trim(),
        sizePreference: compositeSizePreference,
        tshirtSize,
        pantSize,
        capSize,
        categories: selectedCategories,
        source: 'web_registration',
        notes: '',
      });

      const newPass: WaitlistSubmission = {
        id: member.id,
        name: member.name,
        email: member.email,
        phone: member.phone,
        sizePreference: member.sizePreference,
        tshirtSize: member.tshirtSize,
        pantSize: member.pantSize,
        capSize: member.capSize,
        categories: member.categories,
        passCode: member.passCode,
        cryptoSignature: member.cryptoSignature,
        positionNumber: member.positionNumber,
        createdAt: member.createdAt,
        launchDate: member.launchDate,
      };

      setTimeout(() => {
        setIsSubmitting(false);
        setSuccessNotification({
          passCode: member.passCode,
          slotNum: member.positionNumber,
          email: member.email,
          name: member.name,
        });

        setName('');
        setEmail('');
        setPhone('');
        setTshirtSize('M (Oversized)');
        setPantSize('32 (Wide)');
        setCapSize('One Size (Adjustable)');
        setSelectedCategories(['Baseball Cap', 'Denim Loose Pant', 'Heavy Tees']);
        setErrorMessage('');
        setViewMode('form');

        onPassGenerated(newPass);
        playPassRevealSound();
      }, 500);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Could not complete registration. Please retry.');
    }
  };

  const handleCopyCode = () => {
    if (!vipPass) return;
    playTactileClick();
    navigator.clipboard.writeText(vipPass.passCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCalendar = () => {
    playTactileClick();
    if (onOpenCalendarModal) {
      onOpenCalendarModal();
    } else {
      const icsContent = generateICSLaunchInvite();
      downloadFile('UP_N_DOWN_LAUNCH_31DEC.ics', icsContent, 'text/calendar');
    }
  };

  const handleDownloadPassPng = () => {
    if (!vipPass) return;
    playTactileClick();
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 640;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, 1200, 640);

    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 3;
    ctx.strokeRect(40, 40, 1120, 560);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Syne, sans-serif';
    ctx.fillText('UP N DOWN — CLUB ACCESS PASS', 80, 110);

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '18px Space Mono, monospace';
    ctx.fillText('SAME ENERGY DIFFERENT PHASE · STRICT 100 SLOTS ONLY', 80, 150);

    ctx.fillStyle = '#18181b';
    ctx.fillRect(80, 190, 440, 170);
    ctx.strokeStyle = '#3f3f46';
    ctx.strokeRect(80, 190, 440, 170);

    ctx.fillStyle = '#71717a';
    ctx.font = '14px Space Mono, monospace';
    ctx.fillText('MEMBER PASS CODE', 110, 230);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 40px Space Mono, monospace';
    ctx.fillText(vipPass.passCode, 110, 290);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 16px Space Mono, monospace';
    ctx.fillText(`MEMBER SLOT #${vipPass.positionNumber} / 100`, 110, 330);

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '16px Space Mono, monospace';
    ctx.fillText(`EMAIL: ${vipPass.email}`, 560, 230);
    ctx.fillText(`SIZE PREFERENCE: ${vipPass.sizePreference}`, 560, 270);
    ctx.fillText(`LAUNCH DATE: 31ST DEC 2026`, 560, 310);

    ctx.fillStyle = '#71717a';
    ctx.font = '14px Space Mono, monospace';
    ctx.fillText('OFFICIAL RELEASE · 31ST DEC 2026 · INSTAGRAM @UPNDOWN.OFC', 80, 560);

    const dataUrl = canvas.toDataURL('image/png');
    downloadFile(`UP_N_DOWN_PASS_${vipPass.passCode}.png`, dataUrl, 'image/png');
  };

  const remainingSlots = Math.max(0, config.totalSlots - config.claimedSlots);

  return (
    <section id="waitlist" className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto border-b border-[var(--border-main)] transition-colors">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-start">
        {/* Left Column: Context & Guarantees */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <span className="text-xs font-mono uppercase tracking-[0.25em] text-[var(--text-muted)] block mb-1">
              Member Allocation
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[var(--text-primary)] uppercase font-display tracking-tight">
              The Club
            </h2>
          </div>

          <p className="text-[var(--text-secondary)] text-sm sm:text-base font-light leading-relaxed">
            Drop 01 is strictly limited to 100 member slots. Joining the club guarantees your size reservation and early private checkout on 31st Dec 2026.
          </p>

          {/* Clean Value Props */}
          <div className="space-y-4 pt-4 border-t border-[var(--border-main)]">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[var(--bg-subtle)] border border-[var(--border-main)] text-[var(--text-primary)] shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase font-display">
                  Strict 100 Slot Limit
                </h4>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-light">
                  Once all 100 slots are claimed, no additional reservations will open for Drop 01.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-[var(--bg-subtle)] border border-[var(--border-main)] text-[var(--text-primary)] shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase font-display">
                  Instant Confirmation Email
                </h4>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-light">
                  A club pass confirmation is automatically dispatched to your inbox upon reservation.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-[var(--bg-subtle)] border border-[var(--border-main)] text-[var(--text-primary)] shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase font-display">
                  Guaranteed Size Allocation
                </h4>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-light">
                  Your size profile is logged to ensure early private checkout without inventory lockouts.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 text-xs font-mono text-[var(--text-muted)] space-y-1">
            <div>
              Store Concierge:{' '}
              <a
                href="mailto:upndownofficialstore@gmail.com"
                className="text-[var(--text-primary)] hover:underline font-semibold"
              >
                upndownofficialstore@gmail.com
              </a>
            </div>
            <button
              onClick={onOpenPrivacyModal}
              className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] underline underline-offset-4 transition-colors cursor-pointer block pt-1"
            >
              Privacy &amp; Data Protocol →
            </button>
          </div>
        </div>

        {/* Right Column: Interactive Pass or Form */}
        <div className="lg:col-span-7 space-y-4">
          {vipPass && (
            <div className="flex flex-wrap items-center justify-between gap-2 bg-[var(--bg-card)] border border-[var(--border-main)] p-2">
              <div className="flex items-center gap-2 pl-2">
                <Ticket className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono text-[var(--text-secondary)]">
                  Pass on File: <strong className="text-[var(--text-primary)]">Slot #{vipPass.positionNumber}</strong> ({vipPass.passCode})
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    playTactileClick();
                    setViewMode('form');
                  }}
                  className={`px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    viewMode === 'form'
                      ? 'bg-[var(--btn-bg)] text-[var(--btn-text)] shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)]'
                  }`}
                >
                  Registration Form
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playTactileClick();
                    setViewMode('pass');
                  }}
                  className={`px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    viewMode === 'pass'
                      ? 'bg-[var(--btn-bg)] text-[var(--btn-text)] shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)]'
                  }`}
                >
                  View Pass
                </button>
              </div>
            </div>
          )}

          {/* Celebratory Confirmation Banner on registration */}
          {successNotification && (
            <div className="p-5 sm:p-6 bg-emerald-950/95 border border-emerald-500 text-white shadow-xl relative transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="p-2 bg-emerald-400 text-zinc-950 shrink-0 mt-0.5">
                    <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div className="space-y-1.5">
                    <span className="inline-block px-2 py-0.5 bg-emerald-400/20 border border-emerald-400/50 text-emerald-300 text-xs font-mono font-bold uppercase">
                      Slot #{successNotification.slotNum} / 100 Reserved
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black uppercase font-display tracking-wide text-white">
                      You are in to the club!
                    </h3>
                    <p className="text-xs sm:text-sm font-mono text-emerald-100/90 leading-relaxed">
                      Your VIP membership reservation has been secured. A confirmation email has been dispatched to <strong className="text-white underline">{successNotification.email}</strong>.
                    </p>
                    <div className="pt-2 flex flex-wrap items-center gap-2 text-xs font-mono">
                      <span className="px-2.5 py-1 bg-black/60 border border-emerald-500/50 text-emerald-300 font-bold">
                        {successNotification.passCode}
                      </span>
                      {onOpenEmailConfirmation && (
                        <button
                          type="button"
                          onClick={() => {
                            playTactileClick();
                            onOpenEmailConfirmation();
                          }}
                          className="px-2.5 py-1 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-500/40 underline font-bold cursor-pointer transition-colors"
                        >
                          View Email →
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          playTactileClick();
                          setViewMode('pass');
                        }}
                        className="px-2.5 py-1 bg-white text-zinc-950 hover:bg-zinc-200 font-bold uppercase tracking-wider cursor-pointer transition-colors"
                      >
                        Inspect Pass →
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSuccessNotification(null)}
                  className="text-emerald-400 hover:text-white p-1 cursor-pointer transition-colors shrink-0"
                  title="Dismiss notification"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {vipPass && viewMode === 'pass' ? (
            /* Active Club Pass Display */
            <div className="bg-[var(--bg-card)] border border-[var(--border-main)] p-5 sm:p-8 space-y-6 shadow-xl transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
                <div className="flex items-center gap-3">
                  <BrandLogo size={28} showStarGlow={false} />
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                      The Club Member Pass
                    </span>
                    <span className="text-sm font-bold text-[var(--text-primary)] uppercase font-display">
                      UP N DOWN · Drop 01
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-[var(--bg-subtle)] border border-[var(--border-main)] text-xs font-mono font-bold text-emerald-400">
                  SLOT #{vipPass.positionNumber} / 100
                </span>
              </div>

              {/* Pass Code Card */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center bg-[var(--bg-subtle)] border border-[var(--border-subtle)] p-5 sm:p-6">
                <div className="sm:col-span-8 space-y-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] block">
                      Access Pass Code
                    </span>
                    <div className="text-2xl sm:text-3xl font-mono font-bold text-[var(--text-primary)] tracking-wider mt-0.5">
                      {vipPass.passCode}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-mono text-[var(--text-secondary)] pt-2 border-t border-[var(--border-subtle)]">
                    <div>
                      <span className="text-[10px] text-[var(--text-muted)] block">REGISTERED EMAIL</span>
                      <span className="text-[var(--text-primary)] truncate block">{vipPass.email}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-muted)] block">TARGET SIZING</span>
                      <span className="text-[var(--text-primary)] font-bold">{vipPass.sizePreference}</span>
                      {(vipPass.tshirtSize || vipPass.pantSize || vipPass.capSize) && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {vipPass.tshirtSize && (
                            <span className="text-[9px] bg-black/50 border border-white/10 px-1.5 py-0.2 text-emerald-400">
                              Tee: {vipPass.tshirtSize.split(' ')[0]}
                            </span>
                          )}
                          {vipPass.pantSize && (
                            <span className="text-[9px] bg-black/50 border border-white/10 px-1.5 py-0.2 text-emerald-400">
                              Pant: {vipPass.pantSize.split(' ')[0]}
                            </span>
                          )}
                          {vipPass.capSize && (
                            <span className="text-[9px] bg-black/50 border border-white/10 px-1.5 py-0.2 text-emerald-400">
                              Cap: {vipPass.capSize.includes('One Size') ? 'OS' : vipPass.capSize.split(' ')[0]}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-xs font-mono text-[var(--text-secondary)]">
                    DROP LAUNCH: <span className="text-[var(--text-primary)] font-semibold">31st Dec 2026</span>
                  </div>
                </div>

                <div className="sm:col-span-4 flex flex-col items-center justify-center p-2 bg-[var(--bg-card)] border border-[var(--border-main)]">
                  <canvas ref={passCanvasRef} className="w-24 h-24" />
                  <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest mt-1">
                    MEMBER PASS
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                <button
                  onClick={handleCopyCode}
                  className="py-2.5 px-3 text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] border border-[var(--border-main)] hover:border-[var(--text-primary)] bg-[var(--bg-subtle)] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy Code'}</span>
                </button>

                <button
                  onClick={handleDownloadPassPng}
                  className="py-2.5 px-3 text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] border border-[var(--border-main)] hover:border-[var(--text-primary)] bg-[var(--bg-subtle)] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Save Pass</span>
                </button>

                <button
                  onClick={handleDownloadCalendar}
                  className="py-2.5 px-3 text-xs font-mono uppercase tracking-wider text-[var(--btn-text)] bg-[var(--btn-bg)] hover:opacity-90 transition-opacity flex items-center justify-center gap-2 font-bold cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Add to Calendar</span>
                </button>
              </div>
            </div>
          ) : (
            /* Join The Club Registration Form */
            <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] border border-[var(--border-main)] p-5 sm:p-8 space-y-5 sm:space-y-6 shadow-xl transition-colors">
              <div className="border-b border-[var(--border-subtle)] pb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)] uppercase font-display">
                    Join The Club
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] font-light mt-0.5">
                    100 member slots only. Reserve your size profile for Drop 01.
                  </p>
                </div>
                <div className="bg-[var(--bg-subtle)] border border-[var(--border-main)] px-3 py-1.5 text-right">
                  <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">AVAILABLE SLOTS</span>
                  <span className={`text-xs font-mono font-bold ${remainingSlots === 0 ? 'text-red-400' : 'text-[var(--text-primary)]'}`}>
                    {remainingSlots === 0 ? '0 / 100 (FULL)' : `${remainingSlots} / ${config.totalSlots}`}
                  </span>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-950/60 border border-red-800 text-xs text-red-300 font-mono">
                  {errorMessage}
                </div>
              )}

              {/* Inputs */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-xs font-mono uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-[var(--bg-subtle)] border border-[var(--border-main)] focus:border-[var(--text-primary)] focus:outline-none px-3.5 py-2.5 text-xs text-[var(--text-primary)] font-mono placeholder:text-[var(--text-muted)] transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-mono uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                    Email Address <span className="text-[var(--text-primary)]">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yourname@domain.com"
                    className="w-full bg-[var(--bg-subtle)] border border-[var(--border-main)] focus:border-[var(--text-primary)] focus:outline-none px-3.5 py-2.5 text-xs text-[var(--text-primary)] font-mono placeholder:text-[var(--text-muted)] transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-xs font-mono uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                    Phone Number <span className="text-[var(--text-muted)]">(Optional)</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-[var(--bg-subtle)] border border-[var(--border-main)] focus:border-[var(--text-primary)] focus:outline-none px-3.5 py-2.5 text-xs text-[var(--text-primary)] font-mono placeholder:text-[var(--text-muted)] transition-colors"
                  />
                </div>
              </div>

              {/* Individual Target Sizing per Garment Category */}
              <div className="space-y-4 pt-1 border-t border-[var(--border-subtle)]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-bold">
                      Target Sizing Profile:
                    </label>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono block mt-0.5">
                      Individual size reservations for each silhouette in Drop 01
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 border border-emerald-500/40">
                    Guaranteed At Checkout
                  </span>
                </div>

                {/* 1. Heavy T-Shirt Sizing */}
                <div className="p-3.5 bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs font-mono">
                    <div className="flex items-center gap-2 font-bold text-[var(--text-primary)] uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>1. Heavy Tees Sizing</span>
                      <span className="text-[10px] text-[var(--text-muted)] font-normal normal-case hidden sm:inline">
                        · 320 GSM Mock Collar
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-400 font-bold bg-black/40 px-2 py-0.5 border border-emerald-500/30">
                      Active: {tshirtSize}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                    {TSHIRT_SIZES.map((item) => {
                      const isSelected = tshirtSize === item.label;
                      return (
                        <button
                          type="button"
                          key={item.label}
                          onClick={() => {
                            playTactileClick();
                            setTshirtSize(item.label);
                          }}
                          className={`py-2 px-2 text-xs font-mono border text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[var(--btn-bg)] text-[var(--btn-text)] font-bold border-[var(--btn-bg)] shadow-sm'
                              : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-main)] bg-[var(--bg-card)]'
                          }`}
                        >
                          <span className="block font-bold">{item.label}</span>
                          <span className="block text-[9px] text-[var(--text-muted)] mt-0.5 leading-tight">{item.spec}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Loose Pant / Denim Sizing */}
                <div className="p-3.5 bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs font-mono">
                    <div className="flex items-center gap-2 font-bold text-[var(--text-primary)] uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>2. Loose Pant / Denim Sizing</span>
                      <span className="text-[10px] text-[var(--text-muted)] font-normal normal-case hidden sm:inline">
                        · 14.5 oz Raw Selvedge
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-400 font-bold bg-black/40 px-2 py-0.5 border border-emerald-500/30">
                      Active: {pantSize}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5">
                    {PANT_SIZES.map((item) => {
                      const isSelected = pantSize === item.label;
                      return (
                        <button
                          type="button"
                          key={item.label}
                          onClick={() => {
                            playTactileClick();
                            setPantSize(item.label);
                          }}
                          className={`py-2 px-2 text-xs font-mono border text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[var(--btn-bg)] text-[var(--btn-text)] font-bold border-[var(--btn-bg)] shadow-sm'
                              : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-main)] bg-[var(--bg-card)]'
                          }`}
                        >
                          <span className="block font-bold">{item.label}</span>
                          <span className="block text-[9px] text-[var(--text-muted)] mt-0.5 leading-tight">{item.spec}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Baseball Cap / Headwear Sizing */}
                <div className="p-3.5 bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs font-mono">
                    <div className="flex items-center gap-2 font-bold text-[var(--text-primary)] uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>3. Baseball Cap Sizing</span>
                      <span className="text-[10px] text-[var(--text-muted)] font-normal normal-case hidden sm:inline">
                        · 420 GSM 6-Panel Twill
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-400 font-bold bg-black/40 px-2 py-0.5 border border-emerald-500/30">
                      Active: {capSize}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                    {CAP_SIZES.map((item) => {
                      const isSelected = capSize === item.label;
                      return (
                        <button
                          type="button"
                          key={item.label}
                          onClick={() => {
                            playTactileClick();
                            setCapSize(item.label);
                          }}
                          className={`py-2 px-2.5 text-xs font-mono border text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[var(--btn-bg)] text-[var(--btn-text)] font-bold border-[var(--btn-bg)] shadow-sm'
                              : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-main)] bg-[var(--bg-card)]'
                          }`}
                        >
                          <span className="block font-bold">{item.label}</span>
                          <span className="block text-[9px] text-[var(--text-muted)] mt-0.5 leading-tight">{item.spec}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Combined Live Allocation Strip */}
                <div className="p-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                  <div className="text-[var(--text-muted)] text-[10px] uppercase tracking-wider font-bold">
                    RESERVED SIZE BUNDLE:
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-[var(--bg-subtle)] border border-[var(--border-main)] text-[var(--text-primary)] font-bold">
                      Tee: <strong className="text-emerald-400">{tshirtSize.split(' ')[0]}</strong>
                    </span>
                    <span className="text-[var(--text-muted)]">/</span>
                    <span className="px-2 py-0.5 bg-[var(--bg-subtle)] border border-[var(--border-main)] text-[var(--text-primary)] font-bold">
                      Pant: <strong className="text-emerald-400">{pantSize.split(' ')[0]}</strong>
                    </span>
                    <span className="text-[var(--text-muted)]">/</span>
                    <span className="px-2 py-0.5 bg-[var(--bg-subtle)] border border-[var(--border-main)] text-[var(--text-primary)] font-bold">
                      Cap: <strong className="text-emerald-400">{capSize.includes('One Size') ? 'OS' : capSize.split(' ')[0]}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Category checkboxes */}
              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-[var(--text-secondary)]">
                  Preferred Pieces:
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Baseball Cap', 'Denim Loose Pant', 'Heavy Tees'].map((cat) => {
                    const isChecked = selectedCategories.includes(cat);
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={`px-3 py-1.5 text-xs font-mono border transition-colors flex items-center gap-2 cursor-pointer ${
                          isChecked
                            ? 'bg-[var(--bg-subtle)] border-[var(--text-primary)] text-[var(--text-primary)] font-medium'
                            : 'bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                        }`}
                      >
                        <span className={`w-3 h-3 border flex items-center justify-center ${isChecked ? 'bg-[var(--text-primary)] border-[var(--text-primary)] text-[var(--bg-main)]' : 'border-[var(--border-main)]'}`}>
                          {isChecked && <Check className="w-2.5 h-2.5" />}
                        </span>
                        <span>{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Privacy consent checkbox */}
              <div className="pt-2 border-t border-[var(--border-subtle)]">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={privacyConsent}
                    onChange={(e) => setPrivacyConsent(e.target.checked)}
                    className="mt-0.5 accent-[var(--text-primary)]"
                  />
                  <span className="text-xs text-[var(--text-secondary)] font-light leading-relaxed">
                    I agree to reserve 1 of 100 member slots for Drop 01 and receive my Club confirmation credentials for launch on 31st Dec 2026.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || remainingSlots === 0}
                className="w-full py-3.5 bg-[var(--btn-bg)] hover:opacity-90 disabled:opacity-50 text-[var(--btn-text)] font-mono font-bold text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Reserving Member Slot...</span>
                  </>
                ) : remainingSlots === 0 ? (
                  <>
                    <Lock className="w-4 h-4 text-red-400" />
                    <span className="text-red-400">All 100 Slots Claimed</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Join The Club · Reserve Slot</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
