import React, { useState, useEffect } from 'react';
import { motion, type Variants } from 'motion/react';
import { GarmentItem } from '../types';
import { getStoredProducts, DEVELOPER_DATA_UPDATED } from '../utils/developerStorage';
import {
  getStoredVotes,
  getUserVotedProductId,
  castProductVote,
  syncVotesWithServer,
  getProductVoteStats,
  UPNDOWN_VOTES_UPDATED,
} from '../utils/productVotes';
import { playTactileClick } from '../utils/audio';
import { vibrateVote } from '../utils/haptics';
import { GarmentVectorArt } from './GarmentVectorArt';
import { getSupabaseProductImageUrl, getProductImageFallbacks } from '../utils/supabaseStorage';
import { Vote, CheckCircle2, TrendingUp, Flame, Trophy, Sparkles } from 'lucide-react';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
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

export const DropPrediction: React.FC<{ onPredictComplete?: () => void }> = ({
  onPredictComplete,
}) => {
  const [products, setProducts] = useState<GarmentItem[]>(getStoredProducts());
  const [votes, setVotes] = useState<Record<string, number>>(getStoredVotes());
  const [userVotedId, setUserVotedId] = useState<string | null>(getUserVotedProductId());
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [fallbackUrls, setFallbackUrls] = useState<Record<string, string>>({});
  const [attemptedUrls, setAttemptedUrls] = useState<Record<string, string[]>>({});

  const handleImageError = (productId: string, currentSrc: string) => {
    const fallbacks = getProductImageFallbacks(productId);
    const tried = attemptedUrls[productId] || [];
    const updatedTried = [...tried, currentSrc];
    const nextFallback = fallbacks.find((fb) => !updatedTried.includes(fb) && fb !== currentSrc);

    setAttemptedUrls((prev) => ({ ...prev, [productId]: updatedTried }));

    if (nextFallback) {
      setFallbackUrls((prev) => ({ ...prev, [productId]: nextFallback }));
    } else {
      setImageErrors((prev) => ({ ...prev, [productId]: true }));
    }
  };

  useEffect(() => {
    // Initial fetch from server
    syncVotesWithServer().then((v) => setVotes(v));
    setProducts(getStoredProducts());
    setUserVotedId(getUserVotedProductId());

    const handleVotesUpdate = () => {
      setVotes(getStoredVotes());
      setUserVotedId(getUserVotedProductId());
    };

    const handleProductsUpdate = () => {
      setProducts(getStoredProducts());
    };

    window.addEventListener(UPNDOWN_VOTES_UPDATED, handleVotesUpdate);
    window.addEventListener(DEVELOPER_DATA_UPDATED, handleProductsUpdate);

    return () => {
      window.removeEventListener(UPNDOWN_VOTES_UPDATED, handleVotesUpdate);
      window.removeEventListener(DEVELOPER_DATA_UPDATED, handleProductsUpdate);
    };
  }, []);

  const totalSignals = products.reduce((sum, p) => sum + (votes[p.id] || 0), 0);

  const handleVote = async (productId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isSubmittingVote) return;

    vibrateVote();
    playTactileClick();
    setIsSubmittingVote(true);

    const updated = await castProductVote(productId);
    setVotes(updated);
    setUserVotedId(productId);
    setIsSubmittingVote(false);

    if (onPredictComplete) {
      onPredictComplete();
    }
  };

  return (
    <section id="velocity-poll" className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto border-b border-[var(--border-main)] transition-colors">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 sm:mb-12"
      >
        <div>
          <div className="text-xs font-mono uppercase tracking-[0.25em] text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>03. COMMUNITY DEMAND &amp; SELLOUT VELOCITY</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[var(--text-primary)] uppercase font-display tracking-tight">
            WHICH PIECE SELLS OUT FASTEST?
          </h2>
          <p className="text-[var(--text-secondary)] mt-2 max-w-xl text-sm sm:text-base font-light leading-relaxed">
            Strictly 100 allocation slots across the Drop. Cast your prediction on which piece will sell out first when checkout unlocks on 31st Dec.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-[var(--text-secondary)] bg-[var(--bg-subtle)] border border-[var(--border-main)] px-4 py-2.5 shadow-sm">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-[var(--text-primary)]">{totalSignals.toLocaleString()}</span>
            <span>Total Signals Cast</span>
          </div>
          {userVotedId && (
            <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/40 border border-emerald-500/40 px-3 py-2 text-[11px] font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Your Prediction Active</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Grid of All Catalog Products */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {products.map((product) => {
          const stats = getProductVoteStats(product.id, products, votes);
          const isSelected = userVotedId === product.id;

          return (
            <motion.div
              key={product.id}
              variants={itemVariants}
              onClick={() => handleVote(product.id)}
              className={`p-5 sm:p-6 border transition-all cursor-pointer select-none relative overflow-hidden flex flex-col justify-between min-h-[360px] group ${
                isSelected
                  ? 'bg-[var(--bg-subtle)] border-[var(--text-primary)] ring-2 ring-[var(--text-primary)] shadow-2xl'
                  : 'bg-[var(--bg-card)] border-[var(--border-main)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)]/70'
              }`}
            >
              {/* Progress bar background indicator */}
              <div
                className={`absolute bottom-0 left-0 top-0 transition-all duration-700 ease-out pointer-events-none opacity-10 ${
                  stats.isLeader ? 'bg-amber-400' : 'bg-[var(--text-primary)]'
                }`}
                style={{ width: `${stats.percentage}%` }}
              />

              <div className="relative z-10 space-y-3.5">
                {/* Header Strip with Rank & Status */}
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    {stats.isLeader ? (
                      <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/60 text-amber-300 font-bold text-[10px] uppercase flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-amber-400" />
                        <span>#1 Velocity</span>
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)] font-bold">
                        Rank #{stats.rank}
                      </span>
                    )}
                  </div>

                  {isSelected && (
                    <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 border border-emerald-500/40">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Your Pick</span>
                    </span>
                  )}
                </div>

                {/* Garment Visual Canvas: Calibrated Native Frame */}
                {(() => {
                  const isDenim = product.id === 'upndown-denim-01';
                  const cardRatio = isDenim ? '1451 / 1084' : '1084 / 1451';
                  const cardResolutionLabel = isDenim ? '1451 × 1084 PX' : '1084 × 1451 PX';
                  const resolvedImg = fallbackUrls[product.id] || getSupabaseProductImageUrl(product.imageUrl);
                  const canShowImg = Boolean(resolvedImg && !imageErrors[product.id]);

                  return (
                    <div
                      style={{ aspectRatio: cardRatio, maxHeight: '230px' }}
                      className="w-full bg-gradient-to-b from-[#111114] via-[#09090b] to-[#040406] border border-[var(--border-subtle)] flex items-center justify-center relative overflow-hidden p-0 group-hover:border-[var(--border-main)] transition-colors mx-auto"
                    >
                      {/* Viewfinder corner registration marks */}
                      <div className="absolute top-1.5 left-1.5 w-2 h-2 border-t border-l border-emerald-400/80 pointer-events-none z-10" />
                      <div className="absolute top-1.5 right-1.5 w-2 h-2 border-t border-r border-emerald-400/80 pointer-events-none z-10" />
                      <div className="absolute bottom-1.5 left-1.5 w-2 h-2 border-b border-l border-emerald-400/80 pointer-events-none z-10" />
                      <div className="absolute bottom-1.5 right-1.5 w-2 h-2 border-b border-r border-emerald-400/80 pointer-events-none z-10" />

                      {/* Frame Resolution Badge */}
                      <div className="absolute top-2 left-2 z-10 pointer-events-none">
                        <span className="text-[8px] font-mono uppercase bg-black/85 text-emerald-400 px-1.5 py-0.5 border border-emerald-500/40 tracking-wider">
                          {cardResolutionLabel}
                        </span>
                      </div>

                      {canShowImg ? (
                        <img
                          key={resolvedImg}
                          src={resolvedImg}
                          alt={product.name}
                          onError={() => {
                            handleImageError(product.id, resolvedImg);
                          }}
                          className="w-full h-full max-h-full max-w-full object-contain object-center transition-transform duration-500 group-hover:scale-[1.02] select-none"
                        />
                      ) : (
                        <div className="w-32 h-32 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                          <GarmentVectorArt
                            category={product.category === 'caps' ? 'caps' : product.category === 'pants' ? 'pants' : 'tshirts'}
                            view="front"
                            colorHex="#18181b"
                          />
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Piece Info */}
                <div>
                  <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">
                    {product.styleCode} · {product.categoryLabel}
                  </span>
                  <h3 className="text-base font-black text-[var(--text-primary)] uppercase font-display leading-snug mt-0.5">
                    {product.name}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] font-light line-clamp-2 mt-1">
                    {product.tagline}
                  </p>
                </div>
              </div>

              {/* Vote Stats & Call to Action */}
              <div className="relative z-10 pt-3.5 mt-4 border-t border-[var(--border-subtle)] space-y-2.5">
                <div className="flex items-center justify-between font-mono">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
                      {stats.percentage}%
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase">consensus</span>
                  </div>
                  <span className="text-xs text-[var(--text-secondary)] font-mono">
                    {stats.votes.toLocaleString()} votes
                  </span>
                </div>

                {/* Dynamic Button */}
                <button
                  type="button"
                  onClick={(e) => handleVote(product.id, e)}
                  disabled={isSubmittingVote}
                  className={`w-full py-2.5 px-3 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                    isSelected
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-md'
                      : 'bg-[var(--btn-bg)] hover:opacity-90 text-[var(--btn-text)] border-transparent'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Voted #1 Fastest</span>
                    </>
                  ) : (
                    <>
                      <Vote className="w-3.5 h-3.5" />
                      <span>Vote Fastest Sellout</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
};
