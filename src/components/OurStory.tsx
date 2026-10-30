import React from 'react';
import { motion } from 'motion/react';
import { BrandLogo } from './BrandLogo';

export const OurStory: React.FC = () => {
  return (
    <section id="our-story" className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto border-b border-[var(--border-main)] relative overflow-hidden select-none transition-colors">
      <div className="relative z-10 max-w-3xl mx-auto space-y-8 sm:space-y-12 text-center">
        {/* Logo and Subheading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center space-y-3"
        >
          <BrandLogo size={48} showStarGlow={false} />
          <span className="text-xs font-mono uppercase tracking-[0.3em] text-[var(--text-muted)]">
            Our Story
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[var(--text-primary)] uppercase font-display tracking-tight">
            Same Energy. Different Phase.
          </h2>
        </motion.div>

        {/* Narrative Prose */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-[var(--bg-card)] border border-[var(--border-main)] p-6 sm:p-12 space-y-6 text-left shadow-lg transition-colors"
        >
          <p className="text-base sm:text-xl font-light text-[var(--text-primary)] leading-relaxed">
            Born from passion, <strong className="font-semibold text-[var(--text-primary)]">UP N DOWN</strong> was created to redefine streetwear with a premium feel. We blend heavyweight custom fabrics, precise tailoring, and restrained silhouettes to bring individuality and confidence to everyday fashion.
          </p>

          <div className="w-12 h-px bg-[var(--border-strong)]" />

          <p className="text-sm sm:text-base font-light text-[var(--text-secondary)] leading-relaxed">
            More than clothing, we represent the different phases of life — the highs, the lows, and the unyielding energy to keep moving forward.
          </p>

          <div className="pt-4 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-[var(--text-muted)]">
            <span>UP N DOWN · EST. 2026</span>
            <span>DROP 01 · 100 SLOTS ONLY</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
