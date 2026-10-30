import React from 'react';
import { motion, useScroll, useSpring } from 'motion/react';

export const ScrollProgress: React.FC = () => {
  const { scrollYProgress } = useScroll();

  // Silky smooth spring physics to avoid abrupt jumps
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-50 pointer-events-none h-[2px] bg-zinc-950/40"
    >
      {/* Background track subtle hairline */}
      <div className="absolute inset-0 bg-zinc-900/60" />

      {/* Spring-animated progress bar with luxury white/platinum gradient */}
      <motion.div
        className="h-full bg-gradient-to-r from-zinc-500 via-white to-zinc-100 shadow-[0_0_8px_rgba(255,255,255,0.7)]"
        style={{
          scaleX,
          transformOrigin: '0%',
        }}
      />
    </div>
  );
};
