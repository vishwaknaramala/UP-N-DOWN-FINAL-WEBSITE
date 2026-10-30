import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { GarmentItem, ProductCategory } from '../types';
import { getStoredProducts, DEVELOPER_DATA_UPDATED } from '../utils/developerStorage';
import { playTactileClick } from '../utils/audio';
import { vibrateModalOpen } from '../utils/haptics';
import { GarmentVectorArt } from './GarmentVectorArt';
import {
  getStoredVotes,
  getUserVotedProductId,
  castProductVote,
  getProductVoteStats,
  UPNDOWN_VOTES_UPDATED,
} from '../utils/productVotes';
import { vibrateVote } from '../utils/haptics';
import {
  getSupabaseProductImageUrl,
  fetchSupabaseStorageImages,
  matchFileToProductId,
  SUPABASE_STORAGE_BUCKET,
  VERIFIED_PRODUCT_CDN_IMAGES,
  getProductImageFallbacks,
} from '../utils/supabaseStorage';
import {
  Ruler,
  FileText,
  Cpu,
  ChevronRight,
  X,
  Sparkles,
  Flame,
  Vote,
  CheckCircle2,
  SlidersHorizontal,
  Database,
  Maximize2,
} from 'lucide-react';

export const PRODUCT_FRAME_SPECS: Record<
  string,
  {
    width: number;
    height: number;
    ratio: string;
    label: string;
    orientation: 'landscape' | 'portrait';
  }
> = {
  'upndown-denim-01': {
    width: 1451,
    height: 1084,
    ratio: '1451 / 1084',
    label: '1451 × 1084 PX',
    orientation: 'landscape',
  },
  'upndown-cap-07': {
    width: 1084,
    height: 1451,
    ratio: '1084 / 1451',
    label: '1084 × 1451 PX',
    orientation: 'portrait',
  },
  'upndown-tee-01': {
    width: 1084,
    height: 1451,
    ratio: '1084 / 1451',
    label: '1084 × 1451 PX',
    orientation: 'portrait',
  },
  'upndown-tee-02': {
    width: 1084,
    height: 1451,
    ratio: '1084 / 1451',
    label: '1084 × 1451 PX',
    orientation: 'portrait',
  },
};

interface CollectionLookbookProps {
  onPreReserve: (product: GarmentItem, size: string) => void;
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
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export const CollectionLookbook: React.FC<CollectionLookbookProps> = ({
  onPreReserve,
}) => {
  const [activeCategory, setActiveCategory] = useState<ProductCategory>('all');
  const [productList, setProductList] = useState<GarmentItem[]>(getStoredProducts());
  const [selectedProduct, setSelectedProduct] = useState<GarmentItem | null>(null);
  const [activeTab, setActiveTab] = useState<'specs' | 'sizing' | 'hardware'>('specs');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [votes, setVotes] = useState<Record<string, number>>(getStoredVotes());
  const [userVotedId, setUserVotedId] = useState<string | null>(getUserVotedProductId());
  const [globalFrameMode, setGlobalFrameMode] = useState<'calibrated' | '1451x1084'>('calibrated');
  const [cardFrameOverrides, setCardFrameOverrides] = useState<Record<string, '1451x1084' | '1084x1451'>>({});
  const [modalFrameOverride, setModalFrameOverride] = useState<'1451 / 1084' | '1084 / 1451' | null>(null);
  const [cardFitOverrides, setCardFitOverrides] = useState<Record<string, 'cover' | 'contain'>>({});
  const [modalFitOverride, setModalFitOverride] = useState<'cover' | 'contain' | null>(null);
  const [imageLoadErrors, setImageLoadErrors] = useState<Record<string, boolean>>({});
  const [fallbackUrls, setFallbackUrls] = useState<Record<string, string>>({});
  const [attemptedUrls, setAttemptedUrls] = useState<Record<string, string[]>>({});
  const [supabaseBucketFiles, setSupabaseBucketFiles] = useState<string[]>([]);

  const handleImageError = (idKey: string, currentSrc: string, baseProductId?: string) => {
    const rawId = baseProductId || idKey.replace(/^modal_/, '');
    const fallbacks = getProductImageFallbacks(rawId);
    const tried = attemptedUrls[idKey] || [];
    const updatedTried = [...tried, currentSrc];

    // Find the next available fallback that hasn't been tried yet
    const nextFallback = fallbacks.find((fb) => !updatedTried.includes(fb) && fb !== currentSrc);

    setAttemptedUrls((prev) => ({ ...prev, [idKey]: updatedTried }));

    if (nextFallback) {
      setFallbackUrls((prev) => ({ ...prev, [idKey]: nextFallback }));
    } else {
      setImageLoadErrors((prev) => ({ ...prev, [idKey]: true }));
    }
  };

  const toggleCardFit = (productId: string, currentFit?: 'cover' | 'contain') => {
    setCardFitOverrides((prev) => {
      const active = prev[productId] || currentFit || 'contain';
      return { ...prev, [productId]: active === 'contain' ? 'cover' : 'contain' };
    });
  };

  useEffect(() => {
    setProductList(getStoredProducts());
    setVotes(getStoredVotes());
    setUserVotedId(getUserVotedProductId());

    // Sync with Supabase Storage bucket 'product-images'
    fetchSupabaseStorageImages().then((res) => {
      if (res.success && res.files.length > 0) {
        setSupabaseBucketFiles(res.files.map((f) => f.name));
        setProductList((currentList) => {
          let hasChanges = false;
          const updated = currentList.map((prod) => {
            // Find matching file in bucket
            const matchedFile = res.files.find((f) => {
              const matchedId = matchFileToProductId(f.name, currentList);
              return matchedId === prod.id;
            });

            if (matchedFile && matchedFile.publicUrl && prod.imageUrl !== matchedFile.publicUrl) {
              hasChanges = true;
              return { ...prod, imageUrl: matchedFile.publicUrl };
            }
            return prod;
          });
          return hasChanges ? updated : currentList;
        });
      }
    });

    const handleUpdate = () => {
      setProductList(getStoredProducts());
    };
    const handleVotesUpdate = () => {
      setVotes(getStoredVotes());
      setUserVotedId(getUserVotedProductId());
    };

    window.addEventListener(DEVELOPER_DATA_UPDATED, handleUpdate);
    window.addEventListener(UPNDOWN_VOTES_UPDATED, handleVotesUpdate);
    return () => {
      window.removeEventListener(DEVELOPER_DATA_UPDATED, handleUpdate);
      window.removeEventListener(UPNDOWN_VOTES_UPDATED, handleVotesUpdate);
    };
  }, []);

  const handleVotePiece = async (productId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    vibrateVote();
    playTactileClick();
    const updated = await castProductVote(productId);
    setVotes(updated);
    setUserVotedId(productId);
  };

  const filteredProducts =
    activeCategory === 'all'
      ? productList
      : productList.filter((p) => p.category === activeCategory);

  const handleOpenModal = (product: GarmentItem) => {
    vibrateModalOpen();
    playTactileClick();
    setSelectedProduct(product);
    setActiveTab('specs');
    setSelectedSize(product.sizes[0] || 'M');
    setModalFrameOverride(null);
    setModalFitOverride(null);
  };

  const handleCategoryChange = (cat: ProductCategory) => {
    playTactileClick();
    setActiveCategory(cat);
  };

  return (
    <section
      id="collection"
      className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto border-b border-[var(--border-main)] transition-colors"
    >
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[var(--border-main)]"
      >
        <div>
          <span className="text-xs font-mono uppercase tracking-[0.25em] text-[var(--text-muted)] block mb-1">
            Collection Roster
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[var(--text-primary)] uppercase font-display tracking-tight">
            Drop 01 Lookbook
          </h2>
          <p className="text-[var(--text-secondary)] mt-2 max-w-xl text-sm sm:text-base font-light">
            Engineered silhouettes crafted with custom-milled textiles and heavyweight stitching. Limited to 100 member allocations.
          </p>
        </div>

        {/* Right Controls: Resolution Frame Calibrator & Filter Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          {/* Frame Calibrator */}
          <div className="flex items-center gap-1 p-1 bg-[var(--bg-subtle)] border border-[var(--border-main)] shrink-0">
            <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] px-1.5 flex items-center gap-1">
              <Maximize2 className="w-2.5 h-2.5 text-emerald-400" />
              <span className="hidden sm:inline">Frame:</span>
            </span>
            <button
              type="button"
              onClick={() => {
                playTactileClick();
                setGlobalFrameMode('calibrated');
                setCardFrameOverrides({});
              }}
              className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                globalFrameMode === 'calibrated'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              title="Auto-match frame to each garment's exact native resolution (Denim 1451×1084, Cap/Tees 1084×1451) for flush edge-to-edge fit"
            >
              Exact Fit (Flush)
            </button>
            <button
              type="button"
              onClick={() => {
                playTactileClick();
                setGlobalFrameMode('1451x1084');
                setCardFrameOverrides({});
              }}
              className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                globalFrameMode === '1451x1084'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              title="Calibrate all cards to 1451 × 1084 px landscape frame with edge-to-edge fill like Denim"
            >
              1451 × 1084 Frame
            </button>
          </div>

          {/* Clean Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[var(--bg-subtle)] border border-[var(--border-main)] overflow-x-auto no-scrollbar w-full sm:w-auto">
            <button
              onClick={() => handleCategoryChange('all')}
              className={`px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
                activeCategory === 'all'
                  ? 'bg-[var(--btn-bg)] text-[var(--btn-text)] font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              All Pieces ({productList.length})
            </button>
            <button
              onClick={() => handleCategoryChange('tshirts')}
              className={`px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
                activeCategory === 'tshirts'
                  ? 'bg-[var(--btn-bg)] text-[var(--btn-text)] font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Heavy Tees
            </button>
            <button
              onClick={() => handleCategoryChange('pants')}
              className={`px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
                activeCategory === 'pants'
                  ? 'bg-[var(--btn-bg)] text-[var(--btn-text)] font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Loose Denim
            </button>
            <button
              onClick={() => handleCategoryChange('caps')}
              className={`px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
                activeCategory === 'caps'
                  ? 'bg-[var(--btn-bg)] text-[var(--btn-text)] font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Baseball Caps
            </button>
          </div>
        </div>
      </motion.div>

      {/* Product Grid */}
      <motion.div
        key={activeCategory}
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 pt-8 sm:pt-12"
      >
        {filteredProducts.map((product) => {
          const stats = getProductVoteStats(product.id, productList, votes);
          const isVoted = userVotedId === product.id;
          const resolvedImageUrl =
            fallbackUrls[product.id] || getSupabaseProductImageUrl(product.imageUrl);
          const isSupabaseHosted =
            resolvedImageUrl.includes('/storage/v1/object/public/prodct-images') ||
            resolvedImageUrl.includes('/storage/v1/object/public/product-images') ||
            resolvedImageUrl.includes('supabase.co');
          const hasImage = Boolean(resolvedImageUrl && !imageLoadErrors[product.id]);

          const spec = PRODUCT_FRAME_SPECS[product.id] || {
            width: 1451,
            height: 1084,
            ratio: '1451 / 1084',
            label: '1451 × 1084 PX',
            orientation: 'landscape',
          };
          const activeFrameRatio = cardFrameOverrides[product.id]
            ? cardFrameOverrides[product.id] === '1451x1084'
              ? '1451 / 1084'
              : '1084 / 1451'
            : globalFrameMode === '1451x1084'
            ? '1451 / 1084'
            : spec.ratio;

          const frameLabel = activeFrameRatio === '1451 / 1084' ? '1451 × 1084 PX' : '1084 × 1451 PX';
          const effectiveFit =
            cardFitOverrides[product.id] ||
            (activeFrameRatio === '1451 / 1084' && spec.orientation === 'portrait'
              ? 'cover'
              : product.imageFit || 'contain');

          return (
            <motion.article
              key={product.id}
              variants={itemVariants}
              className="group bg-[var(--bg-card)] border border-[var(--border-main)] hover:border-[var(--border-strong)] transition-all duration-200 flex flex-col justify-between shadow-lg relative overflow-hidden"
            >
              {/* Card Header Strip */}
              <div className="bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)] px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--text-primary)] font-bold">{product.styleCode}</span>
                  <span className="text-[var(--text-muted)] uppercase hidden sm:inline">· {product.categoryLabel}</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleVotePiece(product.id, e)}
                  title="Vote which piece will sell out fastest"
                  className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase transition-all flex items-center gap-1 cursor-pointer border ${
                    isVoted
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                      : 'bg-[var(--bg-card)] border-[var(--border-subtle)] hover:border-amber-400 text-[var(--text-secondary)] hover:text-amber-300'
                  }`}
                >
                  <Flame className={`w-3 h-3 ${stats.isLeader ? 'text-amber-400 fill-amber-400' : 'text-amber-400'}`} />
                  <span>{stats.isLeader ? `#1 Fastest (${stats.percentage}%)` : `${stats.percentage}% Votes`}</span>
                </button>
              </div>

              {/* Garment Visual Canvas: 1451 × 1084 Calibrated Frame */}
              <div
                onClick={() => handleOpenModal(product)}
                style={{ aspectRatio: activeFrameRatio }}
                className="relative w-full overflow-hidden cursor-pointer bg-gradient-to-b from-[#111114] via-[#09090b] to-[#040406] border-b border-[var(--border-subtle)] flex items-center justify-center p-0 group"
              >
                {hasImage ? (
                  <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
                    {/* Viewfinder Registration Corner Marks */}
                    <div className="absolute top-2 left-2 w-2.5 h-2.5 border-t border-l border-emerald-400/80 pointer-events-none z-10" />
                    <div className="absolute top-2 right-2 w-2.5 h-2.5 border-t border-r border-emerald-400/80 pointer-events-none z-10" />
                    <div className="absolute bottom-2 left-2 w-2.5 h-2.5 border-b border-l border-emerald-400/80 pointer-events-none z-10" />
                    <div className="absolute bottom-2 right-2 w-2.5 h-2.5 border-b border-r border-emerald-400/80 pointer-events-none z-10" />

                    {/* Frame Calibration Badge */}
                    <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 pointer-events-none">
                      <span className="text-[9px] font-mono uppercase bg-black/85 backdrop-blur-xs text-emerald-400 px-2 py-0.5 border border-emerald-500/40 tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>FRAME: {frameLabel}</span>
                      </span>
                    </div>

                    <img
                      key={resolvedImageUrl}
                      src={resolvedImageUrl}
                      alt={product.name}
                      onError={() => {
                        handleImageError(product.id, resolvedImageUrl, product.id);
                      }}
                      className={`w-full h-full transition-transform duration-500 group-hover:scale-[1.01] ${
                        effectiveFit === 'cover'
                          ? 'object-cover object-center'
                          : 'object-contain object-center'
                      } select-none`}
                    />

                    {/* Corner Controls: Frame Aspect Toggle & Fit Mode */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playTactileClick();
                          setCardFrameOverrides((prev) => ({
                            ...prev,
                            [product.id]: activeFrameRatio === '1451 / 1084' ? '1084x1451' : '1451x1084',
                          }));
                        }}
                        title="Toggle Frame Aspect: 1451×1084 Landscape vs 1084×1451 Portrait"
                        className="text-[9px] font-mono uppercase bg-black/85 hover:bg-black text-white/90 px-2 py-0.5 border border-white/20 tracking-wider flex items-center gap-1 backdrop-blur-xs transition-colors cursor-pointer shadow-md"
                      >
                        <SlidersHorizontal className="w-2.5 h-2.5 text-emerald-400" />
                        <span>{activeFrameRatio === '1451 / 1084' ? '1451×1084' : '1084×1451'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playTactileClick();
                          toggleCardFit(product.id, effectiveFit);
                        }}
                        title="Toggle Image Fit: Fit Whole Piece (100% visible) vs Fill Picture (Cover)"
                        className="text-[9px] font-mono uppercase bg-black/85 hover:bg-black text-white/90 px-2.5 py-1 border border-white/20 tracking-wider flex items-center gap-1.5 backdrop-blur-xs transition-colors cursor-pointer shadow-md"
                      >
                        <span>{effectiveFit === 'contain' ? 'Fit' : 'Fill'}</span>
                      </button>
                    </div>

                    {/* Storage Origin Badge */}
                    <div className="absolute bottom-2.5 right-2.5 z-10 flex items-center pointer-events-none">
                      <span className="text-[9px] font-mono uppercase bg-black/80 backdrop-blur-xs text-white/70 px-2 py-0.5 border border-white/10 tracking-wider flex items-center gap-1">
                        {isSupabaseHosted ? (
                          <>
                            <Database className="w-2.5 h-2.5 text-emerald-400" />
                            <span>prodct-images</span>
                          </>
                        ) : (
                          <span>Studio Photo</span>
                        )}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full max-w-xs h-56 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                    <GarmentVectorArt
                      category={product.category === 'caps' ? 'caps' : product.category === 'pants' ? 'pants' : 'tshirts'}
                      view="front"
                      colorHex="#18181b"
                    />
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] uppercase font-display tracking-tight">
                    {product.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1.5 font-light leading-relaxed">
                    {product.tagline}
                  </p>
                </div>

                {/* Specs Summary */}
                <div className="text-xs font-mono text-[var(--text-muted)] space-y-1 bg-[var(--bg-subtle)] p-3 border border-[var(--border-subtle)]">
                  <div className="flex justify-between">
                    <span>Fabric Weight:</span>
                    <span className="text-[var(--text-primary)] font-semibold">{product.weightLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fit Profile:</span>
                    <span className="text-[var(--text-primary)]">{product.fit}</span>
                  </div>
                </div>

                {/* Sizes & Actions */}
                <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase mr-1">
                      Sizes:
                    </span>
                    {product.sizes.map((s) => (
                      <span
                        key={s}
                        className="text-[10px] font-mono px-2 py-0.5 bg-[var(--bg-subtle)] border border-[var(--border-main)] text-[var(--text-primary)] font-medium"
                      >
                        {s.split(' ')[0]}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleVotePiece(product.id, e)}
                      title="Vote this piece sells out fastest"
                      className={`px-2.5 py-2 text-xs font-mono uppercase tracking-wider border transition-colors flex items-center gap-1 cursor-pointer ${
                        isVoted
                          ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300 font-bold'
                          : 'border-[var(--border-main)] hover:border-amber-400 text-[var(--text-secondary)] hover:text-amber-300 bg-[var(--bg-subtle)]'
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden sm:inline">{isVoted ? 'Voted' : 'Vote Speed'}</span>
                    </button>
                    <button
                      onClick={() => handleOpenModal(product)}
                      className="flex-1 sm:flex-none px-3 py-2 text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] border border-[var(--border-main)] hover:border-[var(--text-primary)] bg-[var(--bg-subtle)] transition-colors cursor-pointer text-center"
                    >
                      Tech Specs
                    </button>
                    <button
                      onClick={() => {
                        playTactileClick();
                        onPreReserve(product, product.sizes[0] || 'M');
                      }}
                      className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-mono uppercase tracking-wider bg-[var(--btn-bg)] text-[var(--btn-text)] font-bold hover:opacity-90 transition-opacity cursor-pointer text-center flex items-center justify-center gap-1"
                    >
                      <span>Reserve</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.article>
          );
        })}
      </motion.div>

      {/* Tech Pack / Sizing Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="bg-[var(--bg-card)] border border-[var(--border-main)] max-w-3xl w-full p-5 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-[var(--border-subtle)] pb-4">
                <div>
                  <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider block">
                    {selectedProduct.styleCode} · {selectedProduct.categoryLabel}
                  </span>
                  <h3
                    id="modal-title"
                    className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] uppercase font-display mt-0.5 tracking-tight"
                  >
                    {selectedProduct.name}
                  </h3>
                  <div className="text-xs font-mono text-[var(--text-secondary)] mt-1">
                    {selectedProduct.composition} · {selectedProduct.weightLabel}
                  </div>
                </div>

                <button
                  onClick={() => {
                    playTactileClick();
                    setSelectedProduct(null);
                  }}
                  className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Product Visual Canvas: Calibrated 1451 × 1084 Modal Frame */}
              {(() => {
                const modalUrl =
                  fallbackUrls[`modal_${selectedProduct.id}`] ||
                  getSupabaseProductImageUrl(selectedProduct.imageUrl);
                const isSupabase =
                  modalUrl.includes('/storage/v1/object/public/prodct-images') ||
                  modalUrl.includes('/storage/v1/object/public/product-images') ||
                  modalUrl.includes('supabase.co');
                const hasModalImage = Boolean(modalUrl && !imageLoadErrors[`modal_${selectedProduct.id}`]);

                const modalSpec = PRODUCT_FRAME_SPECS[selectedProduct.id] || {
                  ratio: '1451 / 1084',
                  label: '1451 × 1084 PX',
                };
                const activeModalRatio = modalFrameOverride || (selectedProduct.id === 'upndown-denim-01' ? '1451 / 1084' : modalSpec.ratio);
                const modalEffectiveFit =
                  modalFitOverride ||
                  (activeModalRatio === '1451 / 1084' && modalSpec.ratio === '1084 / 1451'
                    ? 'cover'
                    : 'contain');

                return (
                  <div
                    style={{ aspectRatio: activeModalRatio, maxHeight: '62vh' }}
                    className="w-full bg-gradient-to-b from-[#111114] via-[#09090b] to-[#040406] border border-[var(--border-subtle)] flex items-center justify-center relative overflow-hidden group p-0 mx-auto"
                  >
                    {hasModalImage ? (
                      <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
                        {/* Viewfinder Registration Marks */}
                        <div className="absolute top-2.5 left-2.5 w-3 h-3 border-t-2 border-l-2 border-emerald-400/80 pointer-events-none z-10" />
                        <div className="absolute top-2.5 right-2.5 w-3 h-3 border-t-2 border-r-2 border-emerald-400/80 pointer-events-none z-10" />
                        <div className="absolute bottom-2.5 left-2.5 w-3 h-3 border-b-2 border-l-2 border-emerald-400/80 pointer-events-none z-10" />
                        <div className="absolute bottom-2.5 right-2.5 w-3 h-3 border-b-2 border-r-2 border-emerald-400/80 pointer-events-none z-10" />

                        {/* Top Left Resolution Badge */}
                        <div className="absolute top-3 left-3 z-10 pointer-events-none">
                          <span className="text-[10px] font-mono uppercase bg-black/85 backdrop-blur-xs text-emerald-400 px-2 py-0.5 border border-emerald-500/40 tracking-wider flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>FRAME: {activeModalRatio === '1451 / 1084' ? '1451 × 1084 PX' : '1084 × 1451 PX'}</span>
                          </span>
                        </div>

                        <img
                          key={modalUrl}
                          src={modalUrl}
                          alt={selectedProduct.name}
                          onError={() => {
                            handleImageError(
                              `modal_${selectedProduct.id}`,
                              modalUrl,
                              selectedProduct.id
                            );
                          }}
                          className={`w-full h-full max-h-full max-w-full ${
                            modalEffectiveFit === 'cover'
                              ? 'object-cover object-center'
                              : 'object-contain object-center'
                          } transition-transform duration-300 select-none`}
                        />

                        {/* Top Right Controls */}
                        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              playTactileClick();
                              setModalFrameOverride(activeModalRatio === '1451 / 1084' ? '1084 / 1451' : '1451 / 1084');
                            }}
                            className="px-2.5 py-1 bg-black/85 hover:bg-black text-[10px] font-mono uppercase text-white border border-white/20 backdrop-blur-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg"
                            title="Toggle Frame Aspect (1451×1084 vs 1084×1451)"
                          >
                            <SlidersHorizontal className="w-3 h-3 text-emerald-400" />
                            <span>Frame: {activeModalRatio === '1451 / 1084' ? '1451×1084' : '1084×1451'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              playTactileClick();
                              setModalFitOverride(modalEffectiveFit === 'contain' ? 'cover' : 'contain');
                            }}
                            className="px-2.5 py-1 bg-black/85 hover:bg-black text-[10px] font-mono uppercase text-white border border-white/20 backdrop-blur-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg"
                            title="Toggle: Fit Whole Piece (100% visible) vs Fill Frame (Cover)"
                          >
                            <span>{modalEffectiveFit === 'contain' ? 'Fit 100%' : 'Fill Frame'}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center">
                        <GarmentVectorArt
                          category={selectedProduct.category === 'caps' ? 'caps' : selectedProduct.category === 'pants' ? 'pants' : 'tshirts'}
                          view="front"
                          colorHex="#18181b"
                        />
                      </div>
                    )}
                    <div className="absolute bottom-2.5 left-3 flex items-center gap-2 z-10">
                      <span className="text-[10px] font-mono uppercase bg-black/80 backdrop-blur-xs text-[var(--text-secondary)] px-2.5 py-0.5 border border-[var(--border-subtle)] flex items-center gap-1.5">
                        {hasModalImage ? (
                          isSupabase ? (
                            <>
                              <Database className="w-2.5 h-2.5 text-emerald-400" />
                              <span>Supabase Storage · prodct-images</span>
                            </>
                          ) : (
                            <span>Studio Archive Photograph</span>
                          )
                        ) : (
                          'Technical Vector Rendering'
                        )}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Modal Navigation Tabs */}
              <div className="flex items-center gap-1 border-b border-[var(--border-subtle)] overflow-x-auto no-scrollbar">
                <button
                  onClick={() => {
                    playTactileClick();
                    setActiveTab('specs');
                  }}
                  className={`px-3.5 py-2 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 border-b-2 ${
                    activeTab === 'specs'
                      ? 'border-[var(--text-primary)] text-[var(--text-primary)] font-bold'
                      : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Embroidery Specs</span>
                </button>

                <button
                  onClick={() => {
                    playTactileClick();
                    setActiveTab('sizing');
                  }}
                  className={`px-3.5 py-2 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 border-b-2 ${
                    activeTab === 'sizing'
                      ? 'border-[var(--text-primary)] text-[var(--text-primary)] font-bold'
                      : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Ruler className="w-3.5 h-3.5" />
                  <span>Size Chart</span>
                </button>

                <button
                  onClick={() => {
                    playTactileClick();
                    setActiveTab('hardware');
                  }}
                  className={`px-3.5 py-2 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 border-b-2 ${
                    activeTab === 'hardware'
                      ? 'border-[var(--text-primary)] text-[var(--text-primary)] font-bold'
                      : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Textile Details</span>
                </button>
              </div>

              {/* Tab 1: Embroidery Specifications */}
              {activeTab === 'specs' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedProduct.embroiderySpecs?.map((spec, idx) => (
                      <div
                        key={idx}
                        className="bg-[var(--bg-subtle)] border border-[var(--border-main)] p-4 space-y-2 text-xs font-mono"
                      >
                        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-1.5">
                          <span className="font-bold text-[var(--text-primary)] uppercase">
                            {spec.placement}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase">
                            Zone 0{idx + 1}
                          </span>
                        </div>
                        <div className="space-y-1 text-[11px]">
                          <div>
                            <span className="text-[var(--text-muted)]">Motif: </span>
                            <span className="text-[var(--text-primary)] font-medium">{spec.artworkName}</span>
                          </div>
                          <div>
                            <span className="text-[var(--text-muted)]">Dimensions: </span>
                            <span className="text-[var(--text-primary)]">{spec.dimensions}</span>
                          </div>
                          <div>
                            <span className="text-[var(--text-muted)]">Stitch Construction: </span>
                            <span className="text-[var(--text-secondary)]">{spec.stitchType}</span>
                          </div>
                          <div>
                            <span className="text-[var(--text-muted)]">Thread: </span>
                            <span className="text-[var(--text-primary)]">{spec.threadColors.join(' · ')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 2: Size Chart Table */}
              {activeTab === 'sizing' && (
                <div className="space-y-4">
                  {selectedProduct.sizeChart && selectedProduct.sizeChart.length > 0 ? (
                    <div className="border border-[var(--border-main)] overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border-main)] text-[var(--text-primary)] font-bold">
                          <tr>
                            <th className="p-2.5 sm:p-3 border-r border-[var(--border-main)]">Size</th>
                            {Object.keys(selectedProduct.sizeChart[0].measurements).map((key) => (
                              <th key={key} className="p-2.5 sm:p-3 border-r border-[var(--border-subtle)] whitespace-nowrap">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-subtle)]">
                          {selectedProduct.sizeChart.map((row) => (
                            <tr
                              key={row.size}
                              className={`transition-colors ${
                                selectedSize === row.size
                                  ? 'bg-[var(--bg-subtle)] font-bold text-[var(--text-primary)]'
                                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                              }`}
                            >
                              <td className="p-2.5 sm:p-3 font-bold border-r border-[var(--border-main)] text-[var(--text-primary)] whitespace-nowrap">
                                {row.size}
                              </td>
                              {Object.entries(row.measurements).map(([mKey, val]) => (
                                <td key={mKey} className="p-2.5 sm:p-3 border-r border-[var(--border-subtle)] whitespace-nowrap">
                                  {val}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 bg-[var(--bg-subtle)] border border-[var(--border-main)] text-xs font-mono">
                      Dimensions: {JSON.stringify(selectedProduct.dimensions)}
                    </div>
                  )}

                  {/* Size Selector */}
                  <div className="pt-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] block mb-2">
                      Select Target Size:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.sizes.map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            playTactileClick();
                            setSelectedSize(s);
                          }}
                          className={`py-1.5 px-3 text-xs font-mono border transition-all cursor-pointer ${
                            selectedSize === s
                              ? 'bg-[var(--btn-bg)] text-[var(--btn-text)] font-bold border-transparent'
                              : 'bg-[var(--bg-subtle)] border-[var(--border-main)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Textile Details */}
              {activeTab === 'hardware' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="bg-[var(--bg-subtle)] border border-[var(--border-main)] p-4 space-y-2">
                    <span className="font-bold text-[var(--text-primary)] uppercase block border-b border-[var(--border-subtle)] pb-1">
                      Finishes &amp; Features
                    </span>
                    <ul className="space-y-1.5 text-[11px] text-[var(--text-secondary)]">
                      {selectedProduct.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-[var(--text-primary)]">/</span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-[var(--bg-subtle)] border border-[var(--border-main)] p-4 space-y-2">
                    <span className="font-bold text-[var(--text-primary)] uppercase block border-b border-[var(--border-subtle)] pb-1">
                      Textile Specifications
                    </span>
                    <div className="space-y-1.5 text-[11px]">
                      <div>
                        <span className="text-[var(--text-muted)]">Composition: </span>
                        <span className="text-[var(--text-primary)] font-medium">{selectedProduct.composition}</span>
                      </div>
                      <div>
                        <span className="text-[var(--text-muted)]">Weight: </span>
                        <span className="text-[var(--text-primary)] font-medium">{selectedProduct.weightLabel}</span>
                      </div>
                      <div>
                        <span className="text-[var(--text-muted)]">Fit Profile: </span>
                        <span className="text-[var(--text-secondary)]">{selectedProduct.fit}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-4 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs font-mono text-[var(--text-muted)]">
                  100 Member Slots Only · 31st Dec 2026
                </span>

                <button
                  onClick={() => {
                    playTactileClick();
                    onPreReserve(selectedProduct, selectedSize || selectedProduct.sizes[0]);
                    setSelectedProduct(null);
                  }}
                  className="w-full sm:w-auto px-6 py-3 bg-[var(--btn-bg)] hover:opacity-90 text-[var(--btn-text)] font-mono font-bold text-xs uppercase tracking-wider transition-opacity cursor-pointer shadow-lg text-center"
                >
                  Reserve ({selectedSize || selectedProduct.sizes[0]}) · Join The Club
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
