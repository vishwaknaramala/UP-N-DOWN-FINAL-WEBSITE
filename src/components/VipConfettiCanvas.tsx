import React, { useEffect, useRef, useState } from 'react';
import { getStoredPalette, THEME_PALETTE_EVENT, BWPaletteId } from '../utils/themePalettes';

export interface VipConfettiCanvasProps {
  triggerCount: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  aspectRatio: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  vRotX: number;
  vRotY: number;
  vRotZ: number;
  wobble: number;
  wobbleSpeed: number;
  color: string;
  alpha: number;
  fadeSpeed: number;
  shape: 'ribbon' | 'star' | 'diamond' | 'disk';
}

export const VipConfettiCanvas: React.FC<VipConfettiCanvasProps> = ({ triggerCount }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [palette, setPalette] = useState<BWPaletteId>(getStoredPalette());

  useEffect(() => {
    const handlePaletteChange = (e: Event) => {
      const customEvent = e as CustomEvent<BWPaletteId>;
      if (customEvent.detail) {
        setPalette(customEvent.detail);
      } else {
        setPalette(getStoredPalette());
      }
    };
    window.addEventListener(THEME_PALETTE_EVENT, handlePaletteChange);
    return () => window.removeEventListener(THEME_PALETTE_EVENT, handlePaletteChange);
  }, []);

  const spawnVipConfetti = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Check for prefers-reduced-motion
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const particleCount = reducedMotion ? 24 : 95; // Subtle, non-chaotic luxury count

    const isLight = palette === 'white';
    // Monochrome luxury palette: platinum, silver, optical white, titanium, obsidian
    const luxuryColors = isLight
      ? [
          '#09090b',
          '#18181b',
          '#27272a',
          '#52525b',
          '#71717a',
          '#a1a1aa',
          '#d4d4d8',
        ]
      : [
          '#ffffff',
          '#f8fafc',
          '#f1f5f9',
          '#e2e8f0',
          '#cbd5e1',
          '#94a3b8',
          '#64748b',
          '#383838',
        ];

    const shapes: ('ribbon' | 'star' | 'diamond' | 'disk')[] = [
      'ribbon',
      'ribbon',
      'star',
      'diamond',
      'disk',
    ];

    const newParticles: Particle[] = [];

    // Dual launcher origins: Left and Right lower margins firing inward-upward
    for (let i = 0; i < particleCount; i++) {
      const isLeft = i % 2 === 0;
      // Start from lower lateral edges or bottom center
      const startX = isLeft
        ? width * 0.15 + (Math.random() - 0.5) * 80
        : width * 0.85 + (Math.random() - 0.5) * 80;
      const startY = height * 0.82 + (Math.random() - 0.5) * 60;

      // Inward-upward velocity
      const angle = isLeft
        ? -Math.PI * (0.28 + Math.random() * 0.22) // ~-50° to -90° (up-right)
        : -Math.PI * (0.50 + Math.random() * 0.22); // ~-90° to -130° (up-left)

      const speed = reducedMotion ? 5 + Math.random() * 4 : 11 + Math.random() * 11;

      newParticles.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 7 + Math.random() * 8,
        aspectRatio: 1.8 + Math.random() * 2.2, // Slender metallic cut
        rotationX: Math.random() * Math.PI * 2,
        rotationY: Math.random() * Math.PI * 2,
        rotationZ: Math.random() * Math.PI * 2,
        vRotX: (Math.random() - 0.5) * 0.16,
        vRotY: (Math.random() - 0.5) * 0.2,
        vRotZ: (Math.random() - 0.5) * 0.1,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.05 + Math.random() * 0.08,
        color: luxuryColors[Math.floor(Math.random() * luxuryColors.length)],
        alpha: 0.95 + Math.random() * 0.05,
        fadeSpeed: 0.0035 + Math.random() * 0.004,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
      });
    }

    particlesRef.current = [...particlesRef.current, ...newParticles];
    setIsActive(true);

    if (!animFrameRef.current) {
      animFrameRef.current = requestAnimationFrame(renderLoop);
    }
  };

  const drawStar = (ctx: CanvasRenderingContext2D, size: number) => {
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.quadraticCurveTo(0, 0, size, 0);
    ctx.quadraticCurveTo(0, 0, 0, size);
    ctx.quadraticCurveTo(0, 0, -size, 0);
    ctx.quadraticCurveTo(0, 0, 0, -size);
    ctx.closePath();
    ctx.fill();
  };

  const drawDiamond = (ctx: CanvasRenderingContext2D, size: number) => {
    ctx.beginPath();
    ctx.moveTo(0, -size * 1.3);
    ctx.lineTo(size * 0.8, 0);
    ctx.lineTo(0, size * 1.3);
    ctx.lineTo(-size * 0.8, 0);
    ctx.closePath();
    ctx.fill();
  };

  const renderLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      animFrameRef.current = null;
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      animFrameRef.current = null;
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const particles = particlesRef.current;
    const gravity = 0.24;
    const drag = 0.982;
    const remaining: Particle[] = [];

    const height = canvas.height;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Physics integration
      p.vx *= drag;
      p.vy = p.vy * drag + gravity;
      p.wobble += p.wobbleSpeed;
      p.x += p.vx + Math.sin(p.wobble) * 0.8;
      p.y += p.vy;

      // 3D rotation
      p.rotationX += p.vRotX;
      p.rotationY += p.vRotY;
      p.rotationZ += p.vRotZ;

      // Fade out
      p.alpha -= p.fadeSpeed;

      // Keep if alive and on screen
      if (p.alpha > 0.01 && p.y < height + 40) {
        remaining.push(p);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotationZ);

        // 3D perspective projection scaling
        const scaleX = Math.cos(p.rotationX);
        const scaleY = Math.cos(p.rotationY);
        ctx.scale(scaleX, scaleY);

        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;

        if (p.shape === 'star') {
          drawStar(ctx, p.size * 0.85);
        } else if (p.shape === 'diamond') {
          drawDiamond(ctx, p.size * 0.7);
        } else if (p.shape === 'disk') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.55, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // 'ribbon' rectangular metallic strip
          const w = p.size;
          const h = p.size * p.aspectRatio;
          ctx.fillRect(-w / 2, -h / 2, w, h);
        }

        ctx.restore();
      }
    }

    particlesRef.current = remaining;

    if (remaining.length > 0) {
      animFrameRef.current = requestAnimationFrame(renderLoop);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      animFrameRef.current = null;
      setIsActive(false);
    }
  };

  // Resize canvas to window size with Retina display scaling
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Trigger confetti burst on triggerCount increment (only when > 0)
  useEffect(() => {
    if (triggerCount > 0) {
      spawnVipConfetti();
    }
  }, [triggerCount]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[80] w-full h-full"
      style={{
        display: isActive ? 'block' : 'none',
      }}
    />
  );
};
