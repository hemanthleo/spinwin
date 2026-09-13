import { useEffect } from 'react';
import type { NameItem } from '../types';

import confetti from 'canvas-confetti';
import { soundManager } from '../logic/soundEffects';
import { Trophy, RotateCcw, Trash2, X, Sparkles } from 'lucide-react';

interface WinnerModalProps {
  winner: NameItem | null;
  onClose: () => void;
  onSpinAgain: () => void;
  onRemoveWinnerAndSpin: (winnerId: string) => void;
}

export const WinnerModal = ({
  winner,
  onClose,
  onSpinAgain,
  onRemoveWinnerAndSpin,
}: WinnerModalProps) => {

  useEffect(() => {
    if (!winner) return;

    // Trigger Fanfare Sound
    soundManager.playWinFanfare();

    // Trigger Confetti Explosion
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#6366F1', '#EC4899', '#F59E0B', '#10B981'],
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#6366F1', '#EC4899', '#F59E0B', '#10B981'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, [winner]);

  // Keyboard shortcut: ESC to close, Space/Enter to spin again
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!winner) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [winner, onClose]);

  if (!winner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      {/* Modal Card */}
      <div className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl p-8 max-w-md w-full shadow-[0_0_80px_rgba(245,158,11,0.25)] text-center space-y-6 overflow-hidden">
        {/* Glow backdrop decorative orb */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full opacity-30 blur-3xl pointer-events-none"
          style={{ backgroundColor: winner.color }}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Trophy Header Badge */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 shadow-lg shadow-amber-500/40 animate-bounce">
          <Trophy className="w-10 h-10" />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Winner Selected</span>
          </div>

          {/* Winner Name Display */}
          <h2
            className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300 break-words py-2 drop-shadow-md"
          >
            {winner.name}
          </h2>
        </div>

        {/* Color Badge */}
        <div className="flex justify-center items-center gap-2">
          <span
            className="w-3 h-3 rounded-full inline-block"
            style={{ backgroundColor: winner.color }}
          />
          <span className="text-xs text-slate-400 font-medium">Selected by destiny</span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={onSpinAgain}
            className="w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 active:scale-95 text-base"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Spin Again</span>
          </button>

          <button
            onClick={() => onRemoveWinnerAndSpin(winner.id)}
            className="w-full bg-slate-800/80 hover:bg-rose-500/20 hover:border-rose-500/40 border border-slate-700 text-slate-300 hover:text-rose-300 font-semibold py-3 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Trash2 className="w-4 h-4" />
            <span>Remove Winner & Spin Again</span>
          </button>
        </div>
      </div>
    </div>
  );
};
