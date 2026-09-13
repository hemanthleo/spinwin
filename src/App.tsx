import { useState, useEffect, useCallback } from 'react';
import type { NameItem, AppSettings, NamePriority } from './types';
import {
  loadStoredNames,
  saveStoredNames,
  loadStoredSettings,
  saveStoredSettings,
  DEFAULT_SETTINGS,
  SLICE_COLORS,
} from './storage/localStorage';
import { selectWinner } from './logic/weightedRandom';
import { soundManager } from './logic/soundEffects';
import { WheelCanvas } from './components/WheelCanvas';
import { NameList } from './components/NameList';
import { WinnerModal } from './components/WinnerModal';
import { PinDialog } from './components/PinDialog';
import { SettingsModal } from './components/SettingsModal';
import { Settings, Volume2, VolumeX, Sparkles, Lock } from 'lucide-react';

export default function App() {

  const [names, setNames] = useState<NameItem[]>(() => loadStoredNames());
  const [settings, setSettings] = useState<AppSettings>(() => loadStoredSettings());

  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [targetWinner, setTargetWinner] = useState<NameItem | null>(null);
  const [currentWinner, setCurrentWinner] = useState<NameItem | null>(null);

  const [showPinDialog, setShowPinDialog] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync state to local storage
  useEffect(() => {
    saveStoredNames(names);
  }, [names]);

  useEffect(() => {
    saveStoredSettings(settings);
    soundManager.setSoundEnabled(settings.soundEnabled);
  }, [settings]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Toggle audio
  const handleToggleSound = () => {
    const next = !settings.soundEnabled;
    const updated = { ...settings, soundEnabled: next };
    setSettings(updated);
    soundManager.setSoundEnabled(next);
    soundManager.playClick();
  };

  // Name management handlers
  const handleAddName = (nameText: string, priority: NamePriority = 'normal') => {
    const newName: NameItem = {
      id: `name-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: nameText,
      enabled: true,
      priority,
      color: SLICE_COLORS[names.length % SLICE_COLORS.length],
    };
    setNames((prev) => [...prev, newName]);
    soundManager.playClick();
  };

  const handleAddBulkNames = (rawText: string) => {
    const parsedLines = rawText
      .split(/[\n,]/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (parsedLines.length === 0) return;

    const newItems: NameItem[] = parsedLines.map((text, idx) => ({
      id: `bulk-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      name: text,
      enabled: true,
      priority: 'normal',
      color: SLICE_COLORS[(names.length + idx) % SLICE_COLORS.length],
    }));

    setNames((prev) => [...prev, ...newItems]);
    showToast(`Added ${newItems.length} names!`);
    soundManager.playClick();
  };

  const handleToggleEnabled = (id: string) => {
    setNames((prev) =>
      prev.map((n) => (n.id === id ? { ...n, enabled: !n.enabled } : n))
    );
    soundManager.playClick();
  };

  const handleDeleteName = (id: string) => {
    setNames((prev) => prev.filter((n) => n.id !== id));
    soundManager.playClick();
  };

  const handleUpdateName = (id: string, newName: string) => {
    setNames((prev) =>
      prev.map((n) => (n.id === id ? { ...n, name: newName } : n))
    );
  };

  const handleShuffleNames = () => {
    setNames((prev) => [...prev].sort(() => Math.random() - 0.5));
    soundManager.playClick();
    showToast('Names shuffled!');
  };

  const handleSetAllEnabled = (enabled: boolean) => {
    setNames((prev) => prev.map((n) => ({ ...n, enabled })));
    soundManager.playClick();
  };

  // Spin Engine Trigger
  const handleStartSpin = useCallback(() => {
    if (isSpinning) return;

    const activeNames = names.filter((n) => n.enabled);
    if (activeNames.length === 0) {
      showToast('Please enable at least 1 name to spin!');
      return;
    }

    // Run Probability / Strategy Engine
    const selection = selectWinner(names, settings);
    if (!selection) {
      showToast('No active names available.');
      return;
    }

    setTargetWinner(selection.winner);
    setIsSpinning(true);
    setCurrentWinner(null);
    soundManager.playClick();
  }, [names, settings, isSpinning]);

  // Callback when wheel finishes spinning animation
  const handleSpinComplete = useCallback((winner: NameItem) => {
    setIsSpinning(false);
    setCurrentWinner(winner);
  }, []);

  const handleRemoveWinnerAndSpin = (winnerId: string) => {
    setNames((prev) => prev.filter((n) => n.id !== winnerId));
    setCurrentWinner(null);
    setTimeout(() => {
      handleStartSpin();
    }, 300);
  };

  // Open Settings handler
  const handleOpenSettings = () => {
    soundManager.playClick();
    if (settings.pinProtected) {
      setShowPinDialog(true);
    } else {
      setShowSettingsModal(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white font-['Outfit',sans-serif]">
      {/* Background Decorative Gradients */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Top Header */}
      <header className="relative z-20 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 p-0.5 shadow-lg shadow-indigo-500/25 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tight text-white flex items-center gap-2">
              Spin a Name
              <span className="text-[10px] font-extrabold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                Pro
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">
              Interactive Decision & Prize Wheel
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {/* Audio Sound Toggle */}
          <button
            onClick={handleToggleSound}
            title={settings.soundEnabled ? 'Mute Sound' : 'Enable Sound'}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
          >
            {settings.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-indigo-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* Hidden/Discrete Settings Entry Button */}
          <button
            onClick={handleOpenSettings}
            title="Settings"
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5"
          >
            <Settings className="w-4 h-4" />
            {settings.pinProtected && <Lock className="w-3 h-3 text-indigo-400" />}
          </button>
        </div>
      </header>

      {/* Toast Alert Message */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-xl border border-indigo-400/30 animate-fadeIn">
          {toastMessage}
        </div>
      )}

      {/* Main Content Layout Grid */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left / Center: Interactive Wheel Section (7 Cols on desktop) */}
        <section className="lg:col-span-7 flex flex-col items-center justify-center space-y-4">
          <WheelCanvas
            names={names}
            isSpinning={isSpinning}
            spinDuration={settings.spinDuration}
            minRotations={settings.minRotations}
            onSpinStart={handleStartSpin}
            onSpinComplete={handleSpinComplete}
            targetWinner={targetWinner}
          />
        </section>

        {/* Right: Public Name Management Panel (5 Cols on desktop) */}
        <section className="lg:col-span-5 h-full">
          <NameList
            names={names}
            onAddName={handleAddName}
            onAddBulkNames={handleAddBulkNames}
            onToggleEnabled={handleToggleEnabled}
            onDeleteName={handleDeleteName}
            onUpdateName={handleUpdateName}
            onShuffleNames={handleShuffleNames}
            onSetAllEnabled={handleSetAllEnabled}
            disabled={isSpinning}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 bg-slate-950/60 py-4 px-6 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
        <p>© Spin a Name — Modern Decision Wheel</p>
        <button
          onClick={handleOpenSettings}
          className="text-slate-500 hover:text-slate-400 hover:underline flex items-center gap-1"
        >
          <Lock className="w-3 h-3" />
          <span>Advanced Admin Settings</span>
        </button>
      </footer>

      {/* Winner Modal Overlay */}
      {currentWinner && (
        <WinnerModal
          winner={currentWinner}
          onClose={() => setCurrentWinner(null)}
          onSpinAgain={() => {
            setCurrentWinner(null);
            setTimeout(() => handleStartSpin(), 250);
          }}
          onRemoveWinnerAndSpin={handleRemoveWinnerAndSpin}
        />
      )}

      {/* PIN Lock Keypad Modal */}
      {showPinDialog && (
        <PinDialog
          correctPin={settings.pinCode || '1234'}
          onSuccess={() => {
            setShowPinDialog(false);
            setShowSettingsModal(true);
          }}
          onClose={() => setShowPinDialog(false)}
        />
      )}

      {/* Settings Configuration Modal */}
      {showSettingsModal && (
        <SettingsModal
          names={names}
          settings={settings}
          onClose={() => setShowSettingsModal(false)}
          onUpdateNames={(newNames) => setNames(newNames)}
          onUpdateSettings={(newSettings) => setSettings(newSettings)}
          onResetAll={() => {
            setSettings(DEFAULT_SETTINGS);
            showToast('Settings reset to default!');
          }}
          onClearNames={() => {
            setNames([]);
            showToast('All names cleared!');
          }}
        />
      )}
    </div>
  );
}
