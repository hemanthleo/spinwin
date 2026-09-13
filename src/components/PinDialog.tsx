import { useState, useEffect } from 'react';

import { Lock, Delete, X, AlertCircle } from 'lucide-react';
import { soundManager } from '../logic/soundEffects';

interface PinDialogProps {
  correctPin: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const PinDialog = ({
  correctPin,
  onSuccess,
  onClose,
}: PinDialogProps) => {

  const [pinInput, setPinInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [shake, setShake] = useState<boolean>(false);

  const handleDigitClick = (digit: string) => {
    soundManager.playClick();
    if (pinInput.length < 6) {
      const nextPin = pinInput + digit;
      setPinInput(nextPin);
      setErrorMsg(null);
      if (nextPin.length === correctPin.length) {
        verifyPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    soundManager.playClick();
    setPinInput((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const verifyPin = (inputToTest: string) => {
    if (inputToTest === correctPin) {
      onSuccess();
    } else {
      setShake(true);
      setErrorMsg('Incorrect Passcode');
      soundManager.playTick(0.5);
      setTimeout(() => {
        setShake(false);
        setPinInput('');
      }, 500);
    }
  };

  // Keyboard navigation listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigitClick(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pinInput, correctPin, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div
        className={`bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xs w-full shadow-2xl text-center space-y-6 transition-transform ${
          shake ? 'animate-shake border-rose-500' : ''
        }`}
      >
        {/* Header */}
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute -top-2 -right-2 p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-slate-100">Enter Admin PIN</h3>
          <p className="text-xs text-slate-400 mt-1">
            Access restricted configuration settings
          </p>
        </div>

        {/* PIN Indicators Dots */}
        <div className="flex justify-center items-center gap-3 py-2">
          {Array.from({ length: Math.max(4, correctPin.length) }).map((_, idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border transition-all duration-200 ${
                idx < pinInput.length
                  ? 'bg-indigo-500 border-indigo-400 scale-110 shadow-[0_0_10px_rgba(99,102,241,0.5)]'
                  : 'bg-slate-950 border-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="flex items-center justify-center gap-1.5 text-rose-400 text-xs font-semibold animate-pulse">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[220px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigitClick(digit)}
              className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-lg transition-colors active:scale-95 flex items-center justify-center"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPinInput('')}
            className="h-12 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-400 font-semibold text-xs transition-colors flex items-center justify-center"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleDigitClick('0')}
            className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-lg transition-colors active:scale-95 flex items-center justify-center"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-12 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-400 font-semibold transition-colors flex items-center justify-center"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
