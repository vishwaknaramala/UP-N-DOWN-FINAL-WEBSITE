import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Lock,
  KeyRound,
  ShieldCheck,
  Plus,
  Trash2,
  Edit3,
  RotateCcw,
  Save,
  Calendar,
  Users,
  Eye,
  EyeOff,
  Palette,
  Download,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  RotateCw,
  Gauge,
  Compass,
  Play,
  Pause,
  Mail,
  Send,
  Layers,
  Image as ImageIcon,
  Flame,
  Trophy,
  Database,
} from 'lucide-react';
import { playTactileClick } from '../utils/audio';
import { GarmentItem } from '../types';
import { ProductImageUploader } from './ProductImageUploader';
import { getSupabaseProductImageUrl } from '../utils/supabaseStorage';
import { getStoredVotes, UPNDOWN_VOTES_UPDATED } from '../utils/productVotes';
import {
  getStoredProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  resetProductsToDefault,
  getStoredConfig,
  saveConfig,
  DeveloperConfig,
  isDeveloperAuthenticated,
  loginDeveloper,
  logoutDeveloper,
  updateDeveloperPassword,
  DEVELOPER_DATA_UPDATED,
  RunwayConfig,
  MaterialFinish,
  ViewMode,
  ShowcaseTarget,
  getStoredRunwayConfig,
  saveRunwayConfig,
} from '../utils/developerStorage';
import {
  BW_PALETTES,
  BWPaletteId,
  getStoredPalette,
  setStoredPalette,
} from '../utils/themePalettes';
import { downloadFile } from '../utils/crypto';
import {
  ClubMemberRecord,
  getStoredClubMembers,
  allocateNewClubMember,
  deleteClubMember,
  resendMemberEmail,
  exportMembersToCsv,
  clearAllClubMembers,
  syncClubMembersWithBackend,
} from '../forms/clubMemberAllocation';
import {
  checkEmailBackendStatus,
  testCustomerEmailDispatch,
  testOwnerEmailDispatch,
} from '../forms/emailDispatchService';

interface DeveloperAdminPortalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductsUpdated?: (products: GarmentItem[]) => void;
}

export const DeveloperAdminPortal: React.FC<DeveloperAdminPortalProps> = ({
  isOpen,
  onClose,
  onProductsUpdated,
}) => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [identityInput, setIdentityInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  // Active Tab (5 organized tabs)
  const [activeTab, setActiveTab] = useState<'collection' | 'members' | 'email' | 'runway' | 'settings'>('collection');

  // Products Data
  const [products, setProducts] = useState<GarmentItem[]>([]);
  const [editingProduct, setEditingProduct] = useState<GarmentItem | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  // Config State
  const [config, setConfig] = useState<DeveloperConfig>(getStoredConfig());

  // 3D Runway Config State
  const [runwayState, setRunwayState] = useState<RunwayConfig>(getStoredRunwayConfig());
  const [runwayBroadcastMsg, setRunwayBroadcastMsg] = useState(false);

  // Club Members Database State
  const [clubMembers, setClubMembers] = useState<ClubMemberRecord[]>(getStoredClubMembers());
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualTeeSize, setManualTeeSize] = useState('M (Oversized)');
  const [manualPantSize, setManualPantSize] = useState('32 (Wide)');
  const [manualCapSize, setManualCapSize] = useState('One Size (Cap)');
  const [memberToastMsg, setMemberToastMsg] = useState<string | null>(null);
  const [isSyncingLedger, setIsSyncingLedger] = useState(false);

  // Email Server Testing State
  const [emailBackendStatus, setEmailBackendStatus] = useState<{
    configured: boolean;
    fromEmail: string;
    ownerEmail: string;
    keyPrefix: string;
  } | null>(null);
  const [testingTargetEmail, setTestingTargetEmail] = useState('vishwaknaramala@gmail.com');
  const [isTestingCustomerEmail, setIsTestingCustomerEmail] = useState(false);
  const [isTestingOwnerEmail, setIsTestingOwnerEmail] = useState(false);
  const [emailTestOutput, setEmailTestOutput] = useState<any | null>(null);
  const [dbStatus, setDbStatus] = useState<{
    supabaseConfigured: boolean;
    supabaseUrl: string;
    tableName: string;
    columns: string[];
    totalRegistrations: number;
    pendingSyncCount?: number;
  } | null>(null);
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);
  const [syncResultMsg, setSyncResultMsg] = useState<string | null>(null);

  // Inline Confirmation States (replacing window.confirm which is blocked in iframes)
  const [confirmDeleteMemberId, setConfirmDeleteMemberId] = useState<string | null>(null);
  const [isConfirmingResetAllMembers, setIsConfirmingResetAllMembers] = useState(false);
  const [confirmDeleteProductId, setConfirmDeleteProductId] = useState<string | null>(null);
  const [isConfirmingResetProducts, setIsConfirmingResetProducts] = useState(false);
  const [productVotes, setProductVotes] = useState<Record<string, number>>(getStoredVotes());

  // Password Change State
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  // New Arrival Draft
  const [draftProduct, setDraftProduct] = useState<Partial<GarmentItem>>({
    name: '',
    styleCode: '',
    category: 'tshirts',
    categoryLabel: 'Heavy Tees',
    tagline: '',
    gsm: 320,
    weightLabel: '320 GSM Cotton',
    editionLimit: 100,
    fit: 'Boxy Silhouette / Dropped Shoulder',
    composition: '100% Combed Cotton',
    features: ['High-density collar', 'Preshrunk vintage wash finish'],
    sizes: ['S', 'M', 'L', 'XL'],
    imageFit: 'contain',
  });

  // Sync state on open and on updates
  useEffect(() => {
    if (isOpen) {
      setIsAuthenticated(isDeveloperAuthenticated());
      setProducts(getStoredProducts());
      setConfig(getStoredConfig());
      setRunwayState(getStoredRunwayConfig());
      setClubMembers(getStoredClubMembers());
      setProductVotes(getStoredVotes());
      setAuthError('');
      checkEmailBackendStatus().then(setEmailBackendStatus).catch(() => {});
      fetch('/api/db-status')
        .then((r) => r.json())
        .then(setDbStatus)
        .catch(() => {});
      syncClubMembersWithBackend().then(setClubMembers).catch(() => {});
      fetch('/api/product-votes')
        .then((r) => r.json())
        .then((data) => {
          if (data?.votes) setProductVotes(data.votes);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    const handleUpdate = () => {
      setProducts(getStoredProducts());
      setConfig(getStoredConfig());
      setRunwayState(getStoredRunwayConfig());
      setClubMembers(getStoredClubMembers());
      setIsAuthenticated(isDeveloperAuthenticated());
    };
    const handleVotes = () => {
      setProductVotes(getStoredVotes());
    };
    window.addEventListener(DEVELOPER_DATA_UPDATED, handleUpdate);
    window.addEventListener(UPNDOWN_VOTES_UPDATED, handleVotes);
    return () => {
      window.removeEventListener(DEVELOPER_DATA_UPDATED, handleUpdate);
      window.removeEventListener(UPNDOWN_VOTES_UPDATED, handleVotes);
    };
  }, []);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    playTactileClick();
    const success = loginDeveloper(identityInput, passwordInput);
    if (success) {
      setIsAuthenticated(true);
      setAuthError('');
      setIdentityInput('');
      setPasswordInput('');
    } else {
      setAuthError('Access denied. Please verify your credentials.');
    }
  };

  const handleLogout = () => {
    playTactileClick();
    logoutDeveloper();
    setIsAuthenticated(false);
  };

  const handleExportCsv = () => {
    playTactileClick();
    const csv = exportMembersToCsv();
    downloadFile('UP_N_DOWN_Club_Members.csv', csv, 'text/csv');
  };

  const handleDeleteMember = async (id: string) => {
    playTactileClick();
    setConfirmDeleteMemberId(null);
    setMemberToastMsg('Deleting member allocation...');
    const remaining = await deleteClubMember(id);
    setClubMembers(remaining);
    setConfig(getStoredConfig());
    fetch('/api/db-status')
      .then((r) => r.json())
      .then(setDbStatus)
      .catch(() => {});
    setMemberToastMsg('Member allocation permanently removed from ledger and database.');
    setTimeout(() => setMemberToastMsg(null), 3000);
  };

  const handleClearAllMembers = async () => {
    playTactileClick();
    setIsConfirmingResetAllMembers(false);
    setMemberToastMsg('Clearing all member allocations...');
    await clearAllClubMembers();
    setClubMembers([]);
    setConfig(getStoredConfig());
    fetch('/api/db-status')
      .then((r) => r.json())
      .then(setDbStatus)
      .catch(() => {});
    setMemberToastMsg('All members deleted. Registration ledger reset to 0.');
    setTimeout(() => setMemberToastMsg(null), 3000);
  };

  const handleResendMemberEmail = async (id: string) => {
    playTactileClick();
    setMemberToastMsg('Sending confirmation email...');
    await resendMemberEmail(id);
    setClubMembers(getStoredClubMembers());
    setMemberToastMsg('Confirmation email sent to member.');
    setTimeout(() => setMemberToastMsg(null), 3000);
  };

  const handleTestCustomerEmail = async () => {
    playTactileClick();
    setIsTestingCustomerEmail(true);
    setEmailTestOutput(null);
    const res = await testCustomerEmailDispatch(testingTargetEmail, 'Atelier VIP Tester');
    setIsTestingCustomerEmail(false);
    setEmailTestOutput({
      action: 'Customer Confirmation Email',
      target: testingTargetEmail,
      ...res,
    });
  };

  const handleTestOwnerEmail = async () => {
    playTactileClick();
    setIsTestingOwnerEmail(true);
    setEmailTestOutput(null);
    const res = await testOwnerEmailDispatch(testingTargetEmail);
    setIsTestingOwnerEmail(false);
    setEmailTestOutput({
      action: 'Owner Registration Alert',
      target: testingTargetEmail,
      ...res,
    });
  };

  const handleSyncSupabase = async () => {
    setIsSyncingSupabase(true);
    setSyncResultMsg(null);
    try {
      const res = await fetch('/api/supabase/sync-pending', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncResultMsg(`Successfully synced ${data.syncedCount} member(s) to Supabase table!`);
        fetch('/api/db-status')
          .then((r) => r.json())
          .then(setDbStatus)
          .catch(() => {});
      } else {
        setSyncResultMsg(data.errors?.[0] || 'Sync could not be completed. Check Supabase RLS policy.');
      }
    } catch (e: any) {
      setSyncResultMsg(e.message || 'Network error during sync');
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  const handleManualAllocateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmail || !manualEmail.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }
    playTactileClick();
    setMemberToastMsg('Allocating spot & sending email...');
    try {
      const composite = `Tee: ${manualTeeSize.split(' ')[0]} · Pant: ${manualPantSize.split(' ')[0]} · Cap: ${manualCapSize.includes('One Size') ? 'OS' : manualCapSize.split(' ')[0]}`;
      await allocateNewClubMember({
        name: manualName,
        email: manualEmail,
        phone: manualPhone,
        sizePreference: composite,
        tshirtSize: manualTeeSize,
        pantSize: manualPantSize,
        capSize: manualCapSize,
        categories: ['Heavy Tees', 'Denim Loose Pant', 'Baseball Cap'],
        source: 'admin_manual',
        notes: '',
      });
      setClubMembers(getStoredClubMembers());
      setIsAddingMember(false);
      setManualName('');
      setManualEmail('');
      setManualPhone('');
      setMemberToastMsg('Member allocated & confirmation email dispatched.');
      setTimeout(() => setMemberToastMsg(null), 3000);
    } catch (err: any) {
      setMemberToastMsg('Error: ' + (err.message || 'Allocation failed.'));
      setTimeout(() => setMemberToastMsg(null), 4000);
    }
  };

  const handleRunwayPieceChange = (piece: ShowcaseTarget) => {
    playTactileClick();
    const next = { ...runwayState, showcaseTarget: piece };
    setRunwayState(next);
    saveRunwayConfig(next);
  };

  const handleRunwayViewModeChange = (mode: ViewMode) => {
    playTactileClick();
    const next = { ...runwayState, viewMode: mode };
    setRunwayState(next);
    saveRunwayConfig(next);
  };

  const handleRunwayFinishChange = (finish: MaterialFinish) => {
    playTactileClick();
    const next = { ...runwayState, materialFinish: finish };
    setRunwayState(next);
    saveRunwayConfig(next);
  };

  const handleRunwaySpeedChange = (speed: number) => {
    const next = { ...runwayState, speedKmh: speed };
    setRunwayState(next);
    saveRunwayConfig(next);
  };

  const handleRunwayRotationToggle = () => {
    playTactileClick();
    const next = { ...runwayState, isRotating: !runwayState.isRotating };
    setRunwayState(next);
    saveRunwayConfig(next);
  };

  const handleSaveConfig = () => {
    playTactileClick();
    saveConfig(config);
    setMemberToastMsg('Launch settings updated.');
    setTimeout(() => setMemberToastMsg(null), 3000);
  };

  const handleDeleteProduct = (productId: string) => {
    playTactileClick();
    setConfirmDeleteProductId(null);
    deleteProduct(productId);
    const updated = getStoredProducts();
    setProducts(updated);
    if (onProductsUpdated) onProductsUpdated(updated);
    setMemberToastMsg('Piece removed from collection.');
    setTimeout(() => setMemberToastMsg(null), 3000);
  };

  const handleResetProducts = () => {
    playTactileClick();
    setIsConfirmingResetProducts(false);
    resetProductsToDefault();
    const updated = getStoredProducts();
    setProducts(updated);
    if (onProductsUpdated) onProductsUpdated(updated);
    setMemberToastMsg('Collection reset to default 4 pieces.');
    setTimeout(() => setMemberToastMsg(null), 3000);
  };

  const handleResetProductVotes = async () => {
    playTactileClick();
    try {
      const res = await fetch('/api/product-votes/reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.votes) setProductVotes(data.votes);
      }
    } catch (e) {}
    setMemberToastMsg('Customer votes baseline reset.');
    setTimeout(() => setMemberToastMsg(null), 3000);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftProduct.name || !draftProduct.styleCode) {
      alert('Please provide Product Name and Style Code.');
      return;
    }

    playTactileClick();
    const id = `upndown-${draftProduct.styleCode.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`;
    const fullProduct: GarmentItem = {
      id,
      name: draftProduct.name,
      styleCode: draftProduct.styleCode.toUpperCase(),
      category: draftProduct.category || 'tshirts',
      categoryLabel: draftProduct.categoryLabel || 'Runway Apparel',
      tagline: draftProduct.tagline || 'Engineered by UP N DOWN.',
      gsm: Number(draftProduct.gsm) || 300,
      weightLabel: draftProduct.weightLabel || `${draftProduct.gsm || 300} GSM Fabrication`,
      editionLimit: Number(draftProduct.editionLimit) || 100,
      fit: draftProduct.fit || 'Archival Fit',
      composition: draftProduct.composition || '100% Premium Cotton',
      features: draftProduct.features || ['Signature styling'],
      colorways: [
        { name: 'Pitch Onyx', hex: '#09090b', subtext: 'Matte Deep Black' },
      ],
      sizes: draftProduct.sizes && draftProduct.sizes.length > 0 ? draftProduct.sizes : ['S', 'M', 'L', 'XL'],
      dimensions: {
        length: '72 cm',
        chest: '60 cm',
        shoulder: '54 cm',
      },
      isDesignSealed: false,
      confidentialCode: `UPNDOWN // ${draftProduct.styleCode}`,
      imageUrl: draftProduct.imageUrl || undefined,
      imageFit: draftProduct.imageFit || 'contain',
    };

    addProduct(fullProduct);
    const updated = getStoredProducts();
    setProducts(updated);
    if (onProductsUpdated) onProductsUpdated(updated);

    setIsAddingProduct(false);
    setMemberToastMsg(`Piece ${fullProduct.styleCode} created and lookbook photo staged.`);
    setTimeout(() => setMemberToastMsg(null), 3500);
    setDraftProduct({
      name: '',
      styleCode: '',
      category: 'tshirts',
      categoryLabel: 'Heavy Tees',
      tagline: '',
      gsm: 320,
      weightLabel: '320 GSM Cotton',
      editionLimit: 100,
      fit: 'Boxy Silhouette / Dropped Shoulder',
      composition: '100% Combed Cotton',
      features: ['High-density collar', 'Preshrunk vintage wash finish'],
      sizes: ['S', 'M', 'L', 'XL'],
      imageUrl: '',
      imageFit: 'contain',
    });
  };

  const handleUpdateProductSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    playTactileClick();
    updateProduct(editingProduct.id, editingProduct);
    const updated = getStoredProducts();
    setProducts(updated);
    if (onProductsUpdated) onProductsUpdated(updated);
    setEditingProduct(null);
    setMemberToastMsg(`Piece ${editingProduct.styleCode} updated.`);
    setTimeout(() => setMemberToastMsg(null), 3500);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordMsg('Password must be at least 6 characters.');
      return;
    }
    playTactileClick();
    updateDeveloperPassword(newPassword);
    setPasswordMsg('Password updated successfully.');
    setNewPassword('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="bg-[var(--bg-card)] border border-[var(--border-main)] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl relative my-auto overflow-hidden text-[var(--text-primary)]"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 sm:px-6 py-3 bg-[var(--bg-card-header)] shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <KeyRound className="w-4 h-4 text-emerald-400" />
            <span className="font-display font-black tracking-wider text-xs sm:text-sm uppercase">
              Developer Admin Portal
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="px-2.5 py-1 text-xs font-mono text-red-400 hover:text-red-300 border border-red-900/40 bg-red-950/20 uppercase cursor-pointer"
              >
                Logout
              </button>
            )}
            <button
              onClick={() => {
                playTactileClick();
                onClose();
              }}
              className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Unauthenticated View: Login Modal */}
        {!isAuthenticated ? (
          <div className="p-6 sm:p-10 max-w-sm mx-auto w-full space-y-5 my-auto">
            <div className="text-center space-y-1.5">
              <div className="w-10 h-10 rounded-full border border-zinc-700 bg-zinc-950 flex items-center justify-center mx-auto text-emerald-400">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold font-display uppercase tracking-wider text-[var(--text-primary)]">
                Developer Login
              </h3>
              <p className="text-xs text-[var(--text-secondary)] font-mono">
                Enter your credentials to access the atelier controls.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                  Developer ID
                </label>
                <input
                  type="text"
                  required
                  value={identityInput}
                  onChange={(e) => setIdentityInput(e.target.value)}
                  placeholder="Enter ID"
                  className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-main)] text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] block">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      playTactileClick();
                      setShowLoginPassword(!showLoginPassword);
                    }}
                    className="text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1 cursor-pointer"
                  >
                    {showLoginPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-main)] text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors"
                />
              </div>

              {authError && (
                <div className="p-2.5 bg-red-950/40 border border-red-800 text-red-300 text-xs font-mono flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-[var(--btn-bg)] hover:opacity-90 text-[var(--btn-text)] font-mono text-xs uppercase font-bold tracking-wider transition-opacity cursor-pointer shadow flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Log In</span>
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Dashboard */
          <div className="flex-1 flex flex-col min-h-0">
            {/* 5 Neat Top Tabs */}
            <div className="flex items-center gap-1 px-4 sm:px-6 pt-2 border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)] overflow-x-auto no-scrollbar shrink-0">
              <button
                onClick={() => {
                  playTactileClick();
                  setActiveTab('collection');
                  setEditingProduct(null);
                  setIsAddingProduct(false);
                }}
                className={`px-3 py-2 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer shrink-0 border-b-2 ${
                  activeTab === 'collection'
                    ? 'border-[var(--text-primary)] text-[var(--text-primary)] font-bold'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Collection ({products.length})
              </button>

              <button
                onClick={() => {
                  playTactileClick();
                  setActiveTab('members');
                }}
                className={`px-3 py-2 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer shrink-0 border-b-2 ${
                  activeTab === 'members'
                    ? 'border-emerald-400 text-emerald-400 font-bold'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Club Members ({clubMembers.length})
              </button>

              <button
                onClick={() => {
                  playTactileClick();
                  setActiveTab('email');
                }}
                className={`px-3 py-2 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer shrink-0 border-b-2 ${
                  activeTab === 'email'
                    ? 'border-indigo-400 text-indigo-400 font-bold'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Email Gateway
              </button>

              <button
                onClick={() => {
                  playTactileClick();
                  setActiveTab('runway');
                }}
                className={`px-3 py-2 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer shrink-0 border-b-2 ${
                  activeTab === 'runway'
                    ? 'border-[var(--text-primary)] text-[var(--text-primary)] font-bold'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                3D Runway
              </button>

              <button
                onClick={() => {
                  playTactileClick();
                  setActiveTab('settings');
                }}
                className={`px-3 py-2 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer shrink-0 border-b-2 ${
                  activeTab === 'settings'
                    ? 'border-[var(--text-primary)] text-[var(--text-primary)] font-bold'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Settings
              </button>
            </div>

            {/* Notification Toast */}
            {memberToastMsg && (
              <div className="mx-4 sm:mx-6 mt-3 p-2.5 bg-emerald-950/70 border border-emerald-500/70 text-emerald-300 text-xs font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{memberToastMsg}</span>
              </div>
            )}

            {/* Scrollable Tab Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
              {/* TAB 1: COLLECTION */}
              {activeTab === 'collection' && (
                <div className="space-y-4">
                  {editingProduct ? (
                    /* Edit Form */
                    <form onSubmit={handleUpdateProductSave} className="space-y-4 bg-[var(--bg-subtle)] p-4 sm:p-5 border border-[var(--border-main)]">
                      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
                        <span className="text-xs font-mono font-bold uppercase text-[var(--text-primary)]">
                          Edit: {editingProduct.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingProduct(null)}
                          className="text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                        <div>
                          <label className="text-[10px] text-[var(--text-muted)] uppercase block mb-1">Product Name</label>
                          <input
                            type="text"
                            value={editingProduct.name}
                            onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                            className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-primary)]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-[var(--text-muted)] uppercase block mb-1">Style Code</label>
                          <input
                            type="text"
                            value={editingProduct.styleCode}
                            onChange={(e) => setEditingProduct({ ...editingProduct, styleCode: e.target.value })}
                            className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-primary)]"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-[var(--text-muted)] uppercase block mb-1">Tagline</label>
                          <input
                            type="text"
                            value={editingProduct.tagline}
                            onChange={(e) => setEditingProduct({ ...editingProduct, tagline: e.target.value })}
                            className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-primary)]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-[var(--text-muted)] uppercase block mb-1">Weight Label</label>
                          <input
                            type="text"
                            value={editingProduct.weightLabel}
                            onChange={(e) => setEditingProduct({ ...editingProduct, weightLabel: e.target.value })}
                            className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-primary)]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-[var(--text-muted)] uppercase block mb-1">Fit</label>
                          <input
                            type="text"
                            value={editingProduct.fit}
                            onChange={(e) => setEditingProduct({ ...editingProduct, fit: e.target.value })}
                            className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-primary)]"
                          />
                        </div>
                        <div className="sm:col-span-2 pt-3 border-t border-[var(--border-subtle)] space-y-2">
                          <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-2.5">
                            <Database className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                            <div>
                              <span className="font-bold uppercase tracking-wider block text-emerald-300">
                                Supabase Storage Image Integration
                              </span>
                              <span className="text-[11px] text-[var(--text-secondary)] block mt-0.5">
                                Paste your Supabase link (or filename like <code className="text-emerald-400 font-bold">CAP.jpeg</code>), pick from your Supabase bucket, or paste an external image link to upload it directly to your bucket.
                              </span>
                            </div>
                          </div>
                          <ProductImageUploader
                            currentImageUrl={editingProduct.imageUrl}
                            onImageChange={(url) => setEditingProduct({ ...editingProduct, imageUrl: url })}
                            category={editingProduct.category}
                            productId={editingProduct.id}
                            imageFit={editingProduct.imageFit || 'cover'}
                            onImageFitChange={(fit) => setEditingProduct({ ...editingProduct, imageFit: fit })}
                            label="Product Lookbook Photo (Supabase Storage)"
                          />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[var(--border-subtle)] flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingProduct(null)}
                          className="px-3 py-1.5 border border-[var(--border-main)] text-xs font-mono text-[var(--text-secondary)]"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-[var(--btn-bg)] text-[var(--btn-text)] text-xs font-mono font-bold uppercase tracking-wider cursor-pointer"
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
                  ) : isAddingProduct ? (
                    /* Add Product Form */
                    <form onSubmit={handleCreateProduct} className="space-y-4 bg-[var(--bg-subtle)] p-4 sm:p-5 border border-[var(--border-main)]">
                      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
                        <span className="text-xs font-mono font-bold uppercase text-[var(--text-primary)]">
                          Add New Piece
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsAddingProduct(false)}
                          className="text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                        <div>
                          <label className="text-[10px] text-[var(--text-muted)] uppercase block mb-1">Product Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Heavy Box Tee"
                            value={draftProduct.name}
                            onChange={(e) => setDraftProduct({ ...draftProduct, name: e.target.value })}
                            className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-primary)]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-[var(--text-muted)] uppercase block mb-1">Style Code</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. STYLE 09"
                            value={draftProduct.styleCode}
                            onChange={(e) => setDraftProduct({ ...draftProduct, styleCode: e.target.value })}
                            className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-primary)]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-[var(--text-muted)] uppercase block mb-1">Category</label>
                          <select
                            value={draftProduct.category}
                            onChange={(e) => setDraftProduct({
                              ...draftProduct,
                              category: e.target.value as any,
                              categoryLabel: e.target.value === 'tshirts' ? 'Heavy Tees' : e.target.value === 'pants' ? 'Loose Denim' : 'Baseball Cap'
                            })}
                            className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-primary)]"
                          >
                            <option value="tshirts">Heavy Tees</option>
                            <option value="pants">Loose Denim</option>
                            <option value="caps">Baseball Cap</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-[var(--text-muted)] uppercase block mb-1">Weight Label</label>
                          <input
                            type="text"
                            placeholder="320 GSM Cotton"
                            value={draftProduct.weightLabel}
                            onChange={(e) => setDraftProduct({ ...draftProduct, weightLabel: e.target.value })}
                            className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-primary)]"
                          />
                        </div>
                        <div className="sm:col-span-2 pt-3 border-t border-[var(--border-subtle)] space-y-2">
                          <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-2.5">
                            <Database className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                            <div>
                              <span className="font-bold uppercase tracking-wider block text-emerald-300">
                                Supabase Storage Product Image
                              </span>
                              <span className="text-[11px] text-[var(--text-secondary)] block mt-0.5">
                                Simply paste your Supabase link (or filename like <code className="text-emerald-400 font-bold">CAP.jpeg</code>). It automatically resolves to your Supabase Storage bucket, generates a live calibrated preview, and attaches it to this new piece.
                              </span>
                            </div>
                          </div>
                          <ProductImageUploader
                            currentImageUrl={draftProduct.imageUrl}
                            onImageChange={(url) => setDraftProduct({ ...draftProduct, imageUrl: url })}
                            category={draftProduct.category as any}
                            productId={draftProduct.id}
                            imageFit={draftProduct.imageFit || 'cover'}
                            onImageFitChange={(fit) => setDraftProduct({ ...draftProduct, imageFit: fit })}
                            label="Product Lookbook Photo (Supabase Storage)"
                          />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[var(--border-subtle)] flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsAddingProduct(false)}
                          className="px-3 py-1.5 border border-[var(--border-main)] text-xs font-mono text-[var(--text-secondary)]"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold uppercase tracking-wider cursor-pointer"
                        >
                          Create Piece
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* Products List */
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--border-subtle)]">
                        <span className="text-xs font-mono uppercase font-bold text-[var(--text-muted)]">
                          Lookbook Catalog
                        </span>
                        <div className="flex items-center gap-2">
                          {isConfirmingResetProducts ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={handleResetProducts}
                                className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold uppercase cursor-pointer"
                              >
                                Confirm Reset
                              </button>
                              <button
                                type="button"
                                onClick={() => setIsConfirmingResetProducts(false)}
                                className="px-2 py-1 border border-[var(--border-main)] text-[10px] text-[var(--text-secondary)] cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setIsConfirmingResetProducts(true)}
                              className="px-2.5 py-1 border border-[var(--border-main)] text-[11px] font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Reset Defaults</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setIsAddingProduct(true)}
                            className="px-3 py-1 bg-[var(--btn-bg)] text-[var(--btn-text)] text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Piece</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5">
                        {products.map((item) => (
                          <div
                            key={item.id}
                            className="p-3.5 bg-[var(--bg-subtle)] border border-[var(--border-main)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono"
                          >
                            <div className="flex items-center gap-3">
                              {item.imageUrl ? (
                                <div className="w-12 h-12 bg-black/90 border border-[var(--border-main)] shrink-0 overflow-hidden relative flex items-center justify-center">
                                  <img
                                    src={getSupabaseProductImageUrl(item.imageUrl)}
                                    alt={item.name}
                                    className="w-full h-full object-contain object-center p-0.5"
                                  />
                                </div>
                              ) : (
                                <div className="w-12 h-12 bg-[var(--bg-card)] border border-[var(--border-subtle)] shrink-0 flex items-center justify-center text-[var(--text-muted)]">
                                  <ImageIcon className="w-4 h-4 opacity-40" />
                                </div>
                              )}
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-bold text-[var(--text-primary)]">{item.name}</span>
                                  <span className="text-[10px] text-[var(--text-muted)]">({item.styleCode})</span>
                                  {item.imageUrl && (
                                    <span className="text-[9px] px-1.5 py-0.5 bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 font-bold uppercase">
                                      Photo Active
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-[var(--text-secondary)] block mt-0.5">
                                  {item.weightLabel} · {item.fit}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                              <button
                                type="button"
                                onClick={() => setEditingProduct(item)}
                                className="px-2.5 py-1 border border-[var(--border-main)] hover:border-[var(--text-primary)] text-[var(--text-primary)] cursor-pointer flex items-center gap-1"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                              {confirmDeleteProductId === item.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteProduct(item.id)}
                                    className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold uppercase cursor-pointer"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteProductId(null)}
                                    className="px-1.5 py-0.5 border border-[var(--border-main)] text-[10px] text-[var(--text-secondary)] cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteProductId(item.id)}
                                  className="p-1 text-zinc-500 hover:text-red-400 cursor-pointer"
                                  title="Delete piece"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Customer Sellout Velocity & Demand Consensus Analytics */}
                      <div className="p-4 bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-3 mt-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2">
                          <div className="flex items-center gap-2">
                            <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
                            <span className="text-xs font-mono font-bold uppercase text-[var(--text-primary)]">
                              Customer Sellout Velocity &amp; Demand Votes
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleResetProductVotes}
                              className="px-2 py-0.5 border border-[var(--border-main)] text-[10px] font-mono text-[var(--text-secondary)] hover:text-amber-400 cursor-pointer"
                            >
                              Reset Poll Baseline
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
                          {products.map((p) => {
                            const totalVotes = products.reduce((sum, item) => sum + (productVotes[item.id] || 0), 0) || 1;
                            const count = productVotes[p.id] || 0;
                            const pct = Math.round((count / totalVotes) * 100);
                            const sorted = [...products].sort((a, b) => (productVotes[b.id] || 0) - (productVotes[a.id] || 0));
                            const rank = sorted.findIndex((item) => item.id === p.id) + 1;

                            return (
                              <div
                                key={p.id}
                                className={`p-2.5 border text-xs font-mono ${
                                  rank === 1
                                    ? 'bg-amber-950/20 border-amber-500/50'
                                    : 'bg-[var(--bg-card)] border-[var(--border-subtle)]'
                                }`}
                              >
                                <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                                  <span>{p.styleCode}</span>
                                  {rank === 1 ? (
                                    <span className="text-amber-400 font-bold uppercase flex items-center gap-0.5">
                                      <Trophy className="w-3 h-3" /> #1 Speed
                                    </span>
                                  ) : (
                                    <span>#{rank}</span>
                                  )}
                                </div>
                                <div className="font-bold text-[var(--text-primary)] truncate mt-0.5">
                                  {p.name}
                                </div>
                                <div className="flex items-baseline justify-between mt-2 pt-1 border-t border-[var(--border-subtle)]">
                                  <span className="text-lg font-bold text-[var(--text-primary)]">{pct}%</span>
                                  <span className="text-[10px] text-[var(--text-secondary)]">{count} votes</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: CLUB MEMBERS */}
              {activeTab === 'members' && (
                <div className="space-y-4">
                  {/* Member Stats & Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--border-subtle)]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold uppercase text-[var(--text-muted)]">
                        Allocated Slots: <strong className="text-[var(--text-primary)]">{clubMembers.length} / 100</strong>
                      </span>
                      <button
                        type="button"
                        disabled={isSyncingLedger}
                        onClick={async () => {
                          playTactileClick();
                          setIsSyncingLedger(true);
                          const synced = await syncClubMembersWithBackend();
                          setClubMembers(synced);
                          setIsSyncingLedger(false);
                          setMemberToastMsg('Database synchronized.');
                          setTimeout(() => setMemberToastMsg(null), 2500);
                        }}
                        className="px-2 py-0.5 text-[10px] font-mono border border-[var(--border-main)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCw className={`w-3 h-3 ${isSyncingLedger ? 'animate-spin' : ''}`} />
                        <span>Sync</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleExportCsv}
                        className="px-2.5 py-1 border border-[var(--border-main)] text-[11px] font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        <span>Export CSV</span>
                      </button>
                      <button
                        onClick={() => setIsAddingMember(!isAddingMember)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Allocate Spot</span>
                      </button>
                      {isConfirmingResetAllMembers ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={handleClearAllMembers}
                            className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold uppercase cursor-pointer"
                          >
                            Confirm Reset All?
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsConfirmingResetAllMembers(false)}
                            className="px-2 py-1 border border-[var(--border-main)] text-[10px] text-[var(--text-secondary)] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsConfirmingResetAllMembers(true)}
                          className="px-2.5 py-1 text-[11px] font-mono text-red-400 hover:text-red-300 border border-red-900/40 bg-red-950/20 uppercase cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Reset All</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Supabase Database Engine Status */}
                  <div className="p-3 bg-[var(--bg-subtle)] border border-[var(--border-main)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${dbStatus?.supabaseConfigured ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      <span className="font-bold text-[var(--text-primary)]">
                        Database: Supabase ({dbStatus?.tableName || 'club_registrations'})
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 border ${
                        dbStatus?.supabaseConfigured
                          ? 'border-emerald-600/60 bg-emerald-950/40 text-emerald-300'
                          : 'border-amber-600/60 bg-amber-950/40 text-amber-300'
                      }`}>
                        {dbStatus?.supabaseConfigured ? 'Active · RLS Protected' : 'Standby (Configure in .env)'}
                      </span>
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)]">
                      Columns: {dbStatus?.columns?.join(', ') || 'id, created_at, NAME, EMAIL, PHONE, T_SHIRT_SIZE, CAP_SIZE, DENIM_JEANS_SIZE'} · 100 Slot Limit
                    </div>
                  </div>

                  {/* Supabase Pending Sync Alert */}
                  {Boolean(dbStatus?.pendingSyncCount && dbStatus.pendingSyncCount > 0) && (
                    <div className="p-3 bg-amber-950/40 border border-amber-600/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
                      <div className="space-y-0.5">
                        <div className="font-bold text-amber-300 flex items-center gap-1.5">
                          <span>⚠</span>
                          <span>{dbStatus?.pendingSyncCount} Member Registration(s) Pending Supabase Sync</span>
                        </div>
                        <p className="text-[11px] text-amber-200/80">
                          To sync directly to your Supabase table, execute the RLS policy in Supabase SQL editor (see supabase_schema.sql), then click Sync Now.
                        </p>
                        {syncResultMsg && (
                          <p className="text-[11px] text-emerald-400 font-bold pt-1">{syncResultMsg}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleSyncSupabase}
                        disabled={isSyncingSupabase}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold uppercase text-[11px] tracking-wider cursor-pointer transition-colors shrink-0"
                      >
                        {isSyncingSupabase ? 'Syncing...' : 'Sync to Supabase'}
                      </button>
                    </div>
                  )}

                  {/* Manual Allocation Drawer */}
                  {isAddingMember && (
                    <form onSubmit={handleManualAllocateMember} className="p-4 bg-[var(--bg-subtle)] border border-emerald-500/50 space-y-3 text-xs font-mono">
                      <span className="font-bold uppercase text-emerald-400 block">
                        Manual Member Allocation
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          placeholder="Full Name (Optional)"
                          value={manualName}
                          onChange={(e) => setManualName(e.target.value)}
                          className="px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-primary)]"
                        />
                        <input
                          type="email"
                          required
                          placeholder="Email Address *"
                          value={manualEmail}
                          onChange={(e) => setManualEmail(e.target.value)}
                          className="px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-primary)]"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                        <div>
                          <label className="text-[10px] text-[var(--text-muted)] uppercase block mb-1">T-Shirt Size</label>
                          <select
                            value={manualTeeSize}
                            onChange={(e) => setManualTeeSize(e.target.value)}
                            className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-primary)]"
                          >
                            <option value="S (Relaxed)">S (Relaxed)</option>
                            <option value="M (Oversized)">M (Oversized)</option>
                            <option value="L (Baggy)">L (Baggy)</option>
                            <option value="XL (Boxy)">XL (Boxy)</option>
                            <option value="XXL (Heavy Boxy)">XXL (Heavy Boxy)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-[var(--text-muted)] uppercase block mb-1">Pant / Denim Size</label>
                          <select
                            value={manualPantSize}
                            onChange={(e) => setManualPantSize(e.target.value)}
                            className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-primary)]"
                          >
                            <option value="28 (Slim Loose)">28 (Slim Loose)</option>
                            <option value="30 (Loose)">30 (Loose)</option>
                            <option value="32 (Wide)">32 (Wide)</option>
                            <option value="34 (Baggy)">34 (Baggy)</option>
                            <option value="36 (Skate Fit)">36 (Skate Fit)</option>
                            <option value="38 (Extra Wide)">38 (Extra Wide)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-[var(--text-muted)] uppercase block mb-1">Cap Size</label>
                          <select
                            value={manualCapSize}
                            onChange={(e) => setManualCapSize(e.target.value)}
                            className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-primary)]"
                          >
                            <option value="One Size (Cap)">One Size (Strapback)</option>
                            <option value="Fitted S/M">Fitted S/M</option>
                            <option value="Fitted L/XL">Fitted L/XL</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsAddingMember(false)}
                          className="px-3 py-1 border border-[var(--border-main)] text-[var(--text-secondary)]"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase tracking-wider"
                        >
                          Confirm &amp; Send Mail
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Members Table */}
                  {clubMembers.length === 0 ? (
                    <div className="p-8 text-center text-xs font-mono text-[var(--text-muted)] border border-dashed border-[var(--border-main)]">
                      No members registered. Allocations are at 0 / 100.
                    </div>
                  ) : (
                    <div className="border border-[var(--border-main)] overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border-main)] text-[var(--text-muted)] uppercase">
                          <tr>
                            <th className="p-2.5">Slot</th>
                            <th className="p-2.5">Email / Name</th>
                            <th className="p-2.5">Size</th>
                            <th className="p-2.5">Pass Code</th>
                            <th className="p-2.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-subtle)]">
                          {clubMembers.map((m) => (
                            <tr key={m.id} className="hover:bg-[var(--bg-subtle)]/50 transition-colors">
                              <td className="p-2.5 font-bold text-emerald-400">
                                #{m.positionNumber.toString().padStart(2, '0')}
                              </td>
                              <td className="p-2.5">
                                <span className="text-[var(--text-primary)] font-medium block truncate max-w-xs">{m.email}</span>
                                {m.name && <span className="text-[10px] text-[var(--text-muted)] block">{m.name}</span>}
                              </td>
                              <td className="p-2.5 text-[var(--text-secondary)]">{m.sizePreference}</td>
                              <td className="p-2.5 font-mono text-[var(--text-secondary)]">{m.passCode}</td>
                              <td className="p-2.5 text-right whitespace-nowrap">
                                {confirmDeleteMemberId === m.id ? (
                                  <div className="flex items-center gap-1 justify-end">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteMember(m.id)}
                                      className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold uppercase cursor-pointer"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteMemberId(null)}
                                      className="px-1.5 py-0.5 border border-[var(--border-main)] text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 justify-end">
                                    <button
                                      type="button"
                                      onClick={() => handleResendMemberEmail(m.id)}
                                      className="px-2 py-1 text-[10px] text-indigo-400 hover:text-indigo-300 border border-indigo-900/40 cursor-pointer"
                                      title="Resend email"
                                    >
                                      Resend
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteMemberId(m.id)}
                                      className="px-2 py-1 text-[10px] text-red-400 hover:text-red-300 border border-red-900/40 hover:bg-red-950/40 cursor-pointer"
                                      title="Delete member"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: EMAIL GATEWAY */}
              {activeTab === 'email' && (
                <div className="space-y-4 text-xs font-mono">
                  {/* Status Banner */}
                  <div className="p-4 bg-[var(--bg-subtle)] border border-[var(--border-main)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] uppercase text-[var(--text-muted)] block">Mail Engine Status</span>
                      <span className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>{emailBackendStatus?.configured ? `Resend API Active (${emailBackendStatus.keyPrefix})` : 'Simulated / Standby'}</span>
                      </span>
                    </div>

                    <div className="text-[11px] text-[var(--text-secondary)] space-y-0.5">
                      <div>Sender: <strong className="text-[var(--text-primary)]">{emailBackendStatus?.fromEmail || 'club@upndownstore.in'}</strong></div>
                      <div>Owner Alert: <strong className="text-emerald-400">{emailBackendStatus?.ownerEmail || 'server configured'}</strong></div>
                    </div>
                  </div>

                  {/* Isolated Email Flow Testing */}
                  <div className="p-4 bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-3">
                    <span className="font-bold uppercase text-[var(--text-muted)] block text-[11px]">
                      Test Dispatch
                    </span>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="email"
                        value={testingTargetEmail}
                        onChange={(e) => setTestingTargetEmail(e.target.value)}
                        placeholder="Recipient test email"
                        className="flex-1 px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-primary)]"
                      />
                      <button
                        type="button"
                        disabled={isTestingCustomerEmail || isTestingOwnerEmail}
                        onClick={handleTestCustomerEmail}
                        className="px-3.5 py-2 bg-[var(--btn-bg)] text-[var(--btn-text)] font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50"
                      >
                        {isTestingCustomerEmail ? 'Sending...' : 'Test Customer Email'}
                      </button>
                      <button
                        type="button"
                        disabled={isTestingCustomerEmail || isTestingOwnerEmail}
                        onClick={handleTestOwnerEmail}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50"
                      >
                        {isTestingOwnerEmail ? 'Sending...' : 'Test Owner Alert'}
                      </button>
                    </div>

                    {emailTestOutput && (
                      <div className="p-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[11px] space-y-1">
                        <div className="flex justify-between text-[var(--text-muted)]">
                          <span>Action: {emailTestOutput.action}</span>
                          <span>Target: {emailTestOutput.target || emailTestOutput.recipient}</span>
                        </div>
                        {emailTestOutput.messageId && (
                          <div className="text-emerald-400 font-bold">
                            Message ID: {emailTestOutput.messageId}
                          </div>
                        )}
                        {emailTestOutput.message && (
                          <div className="text-emerald-300">
                            {emailTestOutput.message}
                          </div>
                        )}
                        {emailTestOutput.error && (
                          <div className="text-red-400">
                            {emailTestOutput.error}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: 3D RUNWAY */}
              {activeTab === 'runway' && (
                <div className="space-y-4 text-xs font-mono">
                  {/* Showcase Target */}
                  <div className="p-4 bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-2.5">
                    <span className="font-bold uppercase text-[var(--text-muted)] block text-[11px]">
                      1. Showcase Silhouette
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'monogram', label: 'Monogram' },
                        { id: 'tee', label: 'Heavy Tee' },
                        { id: 'pants', label: 'Loose Denim' },
                        { id: 'cap', label: 'Baseball Cap' },
                      ].map((item) => {
                        const isSelected = runwayState.showcaseTarget === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleRunwayPieceChange(item.id as ShowcaseTarget)}
                            className={`p-2.5 text-center border uppercase transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[var(--btn-bg)] text-[var(--btn-text)] font-bold border-transparent'
                                : 'border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Camera & Velocity */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-2">
                      <span className="font-bold uppercase text-[var(--text-muted)] block text-[11px]">
                        2. Camera View
                      </span>
                      <div className="flex gap-2">
                        {[
                          { id: 'road', label: 'Road View' },
                          { id: 'orbit', label: 'Orbit' },
                        ].map((mode) => (
                          <button
                            key={mode.id}
                            type="button"
                            onClick={() => handleRunwayViewModeChange(mode.id as ViewMode)}
                            className={`flex-1 py-2 text-center border uppercase transition-colors cursor-pointer ${
                              runwayState.viewMode === mode.id
                                ? 'bg-[var(--btn-bg)] text-[var(--btn-text)] font-bold border-transparent'
                                : 'border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)]'
                            }`}
                          >
                            {mode.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-2">
                      <div className="flex justify-between text-[11px] font-bold uppercase text-[var(--text-muted)]">
                        <span>3. Velocity</span>
                        <span className="text-[var(--text-primary)]">{runwayState.speedKmh} KM/H</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="180"
                        step="10"
                        value={runwayState.speedKmh}
                        onChange={(e) => handleRunwaySpeedChange(parseInt(e.target.value, 10))}
                        className="w-full accent-[var(--text-primary)] cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Material Finish */}
                  <div className="p-4 bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-2">
                    <span className="font-bold uppercase text-[var(--text-muted)] block text-[11px]">
                      4. Material Finish
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'platinum', label: 'Platinum' },
                        { id: 'chrome', label: 'Chrome' },
                        { id: 'obsidian', label: 'Obsidian' },
                        { id: 'gold', label: 'Gold' },
                      ].map((finish) => (
                        <button
                          key={finish.id}
                          type="button"
                          onClick={() => handleRunwayFinishChange(finish.id as MaterialFinish)}
                          className={`p-2 text-center border uppercase transition-colors cursor-pointer ${
                            runwayState.materialFinish === finish.id
                              ? 'bg-[var(--btn-bg)] text-[var(--btn-text)] font-bold border-transparent'
                              : 'border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)]'
                          }`}
                        >
                          {finish.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: SETTINGS */}
              {activeTab === 'settings' && (
                <div className="space-y-4 text-xs font-mono">
                  {/* Launch Dates & Brand */}
                  <div className="p-4 bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-3">
                    <span className="font-bold uppercase text-[var(--text-muted)] block text-[11px]">
                      Launch &amp; Contact Information
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] uppercase text-[var(--text-muted)] block mb-1">Launch Date</label>
                        <input
                          type="text"
                          value={config.launchDateDisplay}
                          onChange={(e) => setConfig({ ...config, launchDateDisplay: e.target.value })}
                          className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-primary)]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase text-[var(--text-muted)] block mb-1">Store Email</label>
                        <input
                          type="email"
                          value={config.storeEmail}
                          onChange={(e) => setConfig({ ...config, storeEmail: e.target.value })}
                          className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-primary)]"
                        />
                      </div>
                    </div>
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={handleSaveConfig}
                        className="px-4 py-1.5 bg-[var(--btn-bg)] text-[var(--btn-text)] font-bold uppercase tracking-wider cursor-pointer"
                      >
                        Save Settings
                      </button>
                    </div>
                  </div>

                  {/* Password Change */}
                  <div className="p-4 bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-3">
                    <span className="font-bold uppercase text-[var(--text-muted)] block text-[11px]">
                      Change Developer Password
                    </span>
                    <form onSubmit={handleChangePassword} className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="password"
                        placeholder="New password (min 6 characters)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="flex-1 px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-primary)]"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[var(--btn-bg)] text-[var(--btn-text)] font-bold uppercase tracking-wider cursor-pointer shrink-0"
                      >
                        Update Password
                      </button>
                    </form>
                    {passwordMsg && <span className="text-emerald-400 block text-[11px]">{passwordMsg}</span>}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
