import { useEffect, useRef, useState, useCallback, useMemo } from 'react';

import type { NameItem } from '../types';

import { calculateTargetAngle, getCurrentSliceIndexUnderPointer, easeOutQuint } from '../logic/wheelCalculation';
import { soundManager } from '../logic/soundEffects';

interface WheelCanvasProps {
  names: NameItem[];
  isSpinning: boolean;
  spinDuration?: number; // seconds
  minRotations?: number;
  onSpinStart: () => void;
  onSpinComplete: (winner: NameItem) => void;
  targetWinner: NameItem | null;
  disabled?: boolean;
}

export const WheelCanvas = ({
  names,
  isSpinning,
  spinDuration = 5,
  minRotations = 6,
  onSpinStart,
  onSpinComplete,
  targetWinner,
  disabled = false,
}: WheelCanvasProps) => {

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Wheel angle state (in degrees)
  const currentAngleRef = useRef<number>(0);
  const lastSliceIndexRef = useRef<number>(-1);
  const animationFrameRef = useRef<number | null>(null);
  const [pointerFlex, setPointerFlex] = useState<number>(0); // for tick bounce effect
  const activeNames = useMemo(() => names.filter((n) => n.enabled), [names]);


  const activeNamesRef = useRef(activeNames);
  activeNamesRef.current = activeNames;

  const onSpinCompleteRef = useRef(onSpinComplete);
  onSpinCompleteRef.current = onSpinComplete;

  // Responsive Canvas Sizing
  const [canvasSize, setCanvasSize] = useState<number>(450);

  const updateSize = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const minDim = Math.min(rect.width, window.innerHeight * 0.55, 520);
      setCanvasSize(Math.max(280, minDim));
    }
  }, []);

  useEffect(() => {
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [updateSize]);

  // Render Wheel onto Canvas
  const drawWheel = useCallback(
    (rotationAngle: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const size = canvasSize;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      ctx.scale(dpr, dpr);

      const centerX = size / 2;
      const centerY = size / 2;
      const radius = size / 2 - 20; // 20px padding for outer shadow & pointer

      ctx.clearRect(0, 0, size, size);

      if (activeNames.length === 0) {
        // Draw empty wheel placeholder
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#1E293B';
        ctx.fill();
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 6;
        ctx.stroke();

        ctx.fillStyle = '#94A3B8';
        ctx.font = '600 18px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Add names to start', centerX, centerY);
        ctx.restore();
        return;
      }

      const sliceAngle = (2 * Math.PI) / activeNames.length;
      const rotationRad = (rotationAngle * Math.PI) / 180;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rotationRad);

      // 1. Draw Slices
      activeNames.forEach((item, index) => {
        const startAngle = index * sliceAngle;
        const endAngle = (index + 1) * sliceAngle;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, startAngle, endAngle);
        ctx.closePath();

        // Fill with gradient for 3D vibrancy
        const midAngle = startAngle + sliceAngle / 2;
        const gradX = Math.cos(midAngle) * radius;
        const gradY = Math.sin(midAngle) * radius;
        const grad = ctx.createLinearGradient(0, 0, gradX, gradY);
        grad.addColorStop(0, item.color);
        grad.addColorStop(1, adjustColorBrightness(item.color, -25));

        ctx.fillStyle = grad;
        ctx.fill();

        // Slice borders
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw Name Text along radius
        ctx.save();
        ctx.rotate(midAngle);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#FFFFFF';

        // Adaptive Font Size
        let fontSize = 16;
        if (activeNames.length > 24) fontSize = 10;
        else if (activeNames.length > 16) fontSize = 12;
        else if (activeNames.length > 10) fontSize = 14;

        ctx.font = `700 ${fontSize}px Outfit, sans-serif`;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 4;

        // Truncate long text
        const maxTextWidth = radius - 55;
        let displayName = item.name;
        if (ctx.measureText(displayName).width > maxTextWidth) {
          while (displayName.length > 3 && ctx.measureText(displayName + '...').width > maxTextWidth) {
            displayName = displayName.substring(0, displayName.length - 1);
          }
          displayName += '...';
        }

        ctx.fillText(displayName, radius - 25, 0);
        ctx.restore();
      });

      ctx.restore();

      // 2. Draw Outer Metallic Ring with Casino Dots
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 4, 0, 2 * Math.PI);
      ctx.lineWidth = 10;
      const ringGrad = ctx.createConicGradient(0, centerX, centerY);
      ringGrad.addColorStop(0, '#F59E0B');
      ringGrad.addColorStop(0.25, '#FCD34D');
      ringGrad.addColorStop(0.5, '#D97706');
      ringGrad.addColorStop(0.75, '#FCD34D');
      ringGrad.addColorStop(1, '#F59E0B');
      ctx.strokeStyle = ringGrad;
      ctx.stroke();

      // Outer Glow Border
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 9, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw Decorative Light Pegs / Dots
      const totalPegs = Math.min(24, Math.max(12, activeNames.length * 2));
      for (let i = 0; i < totalPegs; i++) {
        const pegAngle = (i * 2 * Math.PI) / totalPegs;
        const pegX = centerX + Math.cos(pegAngle) * (radius + 4);
        const pegY = centerY + Math.sin(pegAngle) * (radius + 4);

        ctx.beginPath();
        ctx.arc(pegX, pegY, 3, 0, 2 * Math.PI);
        ctx.fillStyle = i % 2 === 0 ? '#FFFFFF' : '#FEF08A';
        ctx.shadowColor = '#F59E0B';
        ctx.shadowBlur = 6;
        ctx.fill();
      }
      ctx.restore();

      // 3. Draw Center Hub Ring
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, 42, 0, 2 * Math.PI);
      ctx.fillStyle = '#0F172A';
      ctx.fill();
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 4;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.restore();
    },
    [canvasSize, activeNames]
  );

  const drawWheelRef = useRef(drawWheel);
  drawWheelRef.current = drawWheel;

  // Helper color adjuster
  function adjustColorBrightness(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = ((num >> 8) & 0x00ff) + amt;
    const B = (num & 0x0000ff) + amt;
    return (
      '#' +
      (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
      )
        .toString(16)
        .slice(1)
    );
  }

  // Redraw when angle or name list changes
  useEffect(() => {
    drawWheel(currentAngleRef.current);
  }, [drawWheel]);

  // Handle Spinning Animation
  useEffect(() => {
    if (!isSpinning || !targetWinner) return;

    const active = activeNamesRef.current;
    if (active.length === 0) return;

    const winnerIndex = active.findIndex((n) => n.id === targetWinner.id);
    if (winnerIndex === -1) return;

    const startAngle = currentAngleRef.current;
    const { targetAngle } = calculateTargetAngle(
      winnerIndex,
      active.length,
      startAngle,
      minRotations
    );

    const startTime = performance.now();
    const durationMs = spinDuration * 1000;

    lastSliceIndexRef.current = getCurrentSliceIndexUnderPointer(
      startAngle,
      active.length
    );

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);

      // Ease out quint curve
      const easeProgress = easeOutQuint(progress);
      const currentAngle = startAngle + (targetAngle - startAngle) * easeProgress;
      currentAngleRef.current = currentAngle;

      // Draw frame
      drawWheelRef.current(currentAngle);

      // Check slice index transition for audio tick & pointer animation
      const currentSliceIndex = getCurrentSliceIndexUnderPointer(
        currentAngle,
        active.length
      );

      if (currentSliceIndex !== lastSliceIndexRef.current) {
        lastSliceIndexRef.current = currentSliceIndex;
        // Pitch tick sound based on spin speed
        const currentSpeed = 1 - progress;
        soundManager.playTick(0.8 + currentSpeed * 0.8);

        // Pointer click flex effect
        setPointerFlex(12);
        setTimeout(() => setPointerFlex(0), 60);
      }

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Animation finished!
        currentAngleRef.current = targetAngle % 360;
        drawWheelRef.current(currentAngleRef.current);
        onSpinCompleteRef.current(targetWinner);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isSpinning, targetWinner, spinDuration, minRotations]);


  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center justify-center select-none py-4"
    >
      {/* Top Pointer Ticker */}
      <div
        className="absolute top-1 z-30 transition-transform duration-75 ease-out filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]"
        style={{
          transform: `translateY(${pointerFlex > 0 ? -4 : 0}px) rotate(${
            pointerFlex > 0 ? -12 : 0
          }deg)`,
        }}
      >
        <svg width="40" height="46" viewBox="0 0 40 46" fill="none">
          <path
            d="M20 46L3.5 12C1.5 8 4 3 8.5 3H31.5C36 3 38.5 8 36.5 12L20 46Z"
            fill="url(#pointerGrad)"
            stroke="#78350F"
            strokeWidth="2"
          />
          <circle cx="20" cy="12" r="5" fill="#FEF08A" stroke="#78350F" strokeWidth="1.5" />
          <defs>
            <linearGradient id="pointerGrad" x1="20" y1="3" x2="20" y2="46" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FBBF24" />
              <stop offset="1" stopColor="#D97706" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Canvas Element */}
      <div className="relative p-2 rounded-full bg-slate-900/60 backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-slate-800">
        <canvas
          ref={canvasRef}
          style={{ width: canvasSize, height: canvasSize }}
          className="block rounded-full cursor-pointer"
          onClick={() => {
            if (!isSpinning && !disabled && activeNames.length > 0) {
              onSpinStart();
            }
          }}
        />

        {/* Central SPIN Button */}
        <button
          onClick={() => {
            if (!isSpinning && !disabled && activeNames.length > 0) {
              onSpinStart();
            }
          }}
          disabled={isSpinning || disabled || activeNames.length === 0}
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center font-black text-white uppercase tracking-wider text-sm sm:text-base transition-all duration-300 ${
            isSpinning || activeNames.length === 0
              ? 'bg-slate-700 opacity-80 cursor-not-allowed shadow-none'
              : 'bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 hover:scale-105 active:scale-95 shadow-[0_0_25px_rgba(245,158,11,0.6)] border-4 border-amber-200 cursor-pointer animate-pulse'
          }`}
        >
          <span className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-extrabold text-base sm:text-lg">
            {isSpinning ? '...' : 'SPIN'}
          </span>
        </button>
      </div>
    </div>
  );
};
