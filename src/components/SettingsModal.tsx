import { useState } from 'react';
import type { NameItem, AppSettings, NamePriority } from '../types';
import { exportConfiguration, validateAndImportConfiguration } from '../storage/localStorage';
import {
  X,
  Sliders,
  Users,
  Shield,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  MoveUp,
  MoveDown,
  EyeOff,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';


interface SettingsModalProps {
  names: NameItem[];
  settings: AppSettings;
  onClose: () => void;
  onUpdateNames: (newNames: NameItem[]) => void;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onResetAll: () => void;
  onClearNames: () => void;
}

type TabType = 'priority' | 'weights' | 'secret' | 'security' | 'data';

export const SettingsModal = ({
  names,
  settings,
  onClose,
  onUpdateNames,
  onUpdateSettings,
  onResetAll,
  onClearNames,
}: SettingsModalProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('priority');
  const [localSettings, setLocalSettings] = useState<AppSettings>({ ...settings });
  const [localNames, setLocalNames] = useState<NameItem[]>([...names]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);




  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSaveSettings = (updated: Partial<AppSettings>) => {
    const newSettings = { ...localSettings, ...updated };
    setLocalSettings(newSettings);
    onUpdateSettings(newSettings);
  };

  const handlePriorityChange = (id: string, priority: NamePriority) => {
    const updated = localNames.map((item) =>
      item.id === id ? { ...item, priority } : item
    );
    setLocalNames(updated);
    onUpdateNames(updated);
  };

  const handleMoveName = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= localNames.length) return;
    const updated = [...localNames];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    setLocalNames(updated);
    onUpdateNames(updated);
  };

  const handleDeleteName = (id: string) => {
    const updated = localNames.filter((item) => item.id !== id);
    setLocalNames(updated);
    onUpdateNames(updated);
  };

  const handleExportJSON = () => {
    const jsonStr = exportConfiguration(localNames, localSettings);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spin-a-name-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', 'Configuration exported successfully!');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const result = validateAndImportConfiguration(text);
        setLocalNames(result.names);
        onUpdateNames(result.names);
        if (Object.keys(result.settings).length > 0) {
          const merged = { ...localSettings, ...result.settings };
          setLocalSettings(merged);
          onUpdateSettings(merged);
        }
        showToast('success', `Imported ${result.names.length} names successfully!`);
      } catch (err: any) {
        showToast('error', err.message || 'Import failed. Invalid JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      {/* Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full h-[90vh] max-h-[720px] shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg text-slate-100">Advanced Settings</h2>
              <p className="text-xs text-slate-400">Configure priorities, secret modes, and app system</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Notification */}
        {notification && (
          <div
            className={`px-4 py-2 text-xs font-semibold text-center transition-all ${
              notification.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-300 border-b border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border-b border-rose-500/30'
            }`}
          >
            {notification.message}
          </div>
        )}

        {/* Body Grid Layout (Tabs sidebar + content) */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          {/* Navigation Sidebar */}
          <div className="w-full sm:w-56 bg-slate-950/50 border-r border-slate-800 p-3 space-y-1 flex sm:flex-col overflow-x-auto sm:overflow-x-visible">
            <button
              onClick={() => setActiveTab('priority')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
                activeTab === 'priority'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4 flex-shrink-0" />
              <span>Name Priorities</span>
            </button>

            <button
              onClick={() => setActiveTab('weights')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
                activeTab === 'weights'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-4 h-4 flex-shrink-0" />
              <span>Priority Weights</span>
            </button>

            <button
              onClick={() => setActiveTab('secret')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
                activeTab === 'secret'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <EyeOff className="w-4 h-4 flex-shrink-0 text-amber-400" />
              <span className="flex items-center gap-1.5">
                <span>Secret Controls</span>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              </span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
                activeTab === 'security'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Shield className="w-4 h-4 flex-shrink-0" />
              <span>Security & PIN</span>
            </button>

            <button
              onClick={() => setActiveTab('data')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
                activeTab === 'data'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Download className="w-4 h-4 flex-shrink-0" />
              <span>Backup & Import</span>
            </button>
          </div>

          {/* Tab Content Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* TAB 1: Name Priorities */}
            {activeTab === 'priority' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-100 text-base">Priority Management</h3>
                    <p className="text-xs text-slate-400">
                      Assign High, Normal, or Low priority to each name.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 border border-slate-800 rounded-2xl p-2 bg-slate-950/40">
                  {localNames.length === 0 ? (
                    <p className="text-center py-6 text-slate-500 text-xs">No names available.</p>
                  ) : (
                    localNames.map((item, idx) => (
                      <div
                        key={item.id}
                        className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800"
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-[140px]">
                          <span className="text-xs text-slate-500 font-mono w-5">{idx + 1}.</span>
                          <div
                            className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="font-medium text-sm text-slate-200 truncate">
                            {item.name}
                          </span>
                        </div>

                        {/* Priority Selector */}
                        <div className="flex items-center gap-2">
                          <select
                            value={item.priority}
                            onChange={(e) =>
                              handlePriorityChange(item.id, e.target.value as NamePriority)
                            }
                            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="high"> High Priority</option>
                            <option value="normal"> Normal Priority</option>
                            <option value="low"> Low Priority</option>
                          </select>

                          {/* Reorder & Delete */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleMoveName(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                            >
                              <MoveUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleMoveName(idx, 'down')}
                              disabled={idx === localNames.length - 1}
                              className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                            >
                              <MoveDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteName(item.id)}
                              className="p-1 text-slate-400 hover:text-rose-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: Priority Weights */}
            {activeTab === 'weights' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-slate-100 text-base">Priority Weight Multipliers</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Control the exact mathematical probability weights for each priority group.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* High Priority Weight */}
                  <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 space-y-2">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                      High Priority Weight
                    </span>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      value={localSettings.highPriorityWeight}
                      onChange={(e) =>
                        handleSaveSettings({ highPriorityWeight: parseFloat(e.target.value) || 5 })
                      }
                      className="w-full bg-slate-950 border border-indigo-500/40 rounded-xl px-3 py-2 text-xl font-black text-indigo-300 focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-400">Default: 5x chance</p>
                  </div>

                  {/* Normal Priority Weight */}
                  <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-2">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Normal Priority Weight
                    </span>
                    <input
                      type="number"
                      step="0.5"
                      min="0.1"
                      value={localSettings.normalPriorityWeight}
                      onChange={(e) =>
                        handleSaveSettings({ normalPriorityWeight: parseFloat(e.target.value) || 1 })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xl font-black text-slate-100 focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-400">Default: 1x chance</p>
                  </div>

                  {/* Low Priority Weight */}
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Low Priority Weight
                    </span>
                    <input
                      type="number"
                      step="0.05"
                      min="0.01"
                      value={localSettings.lowPriorityWeight}
                      onChange={(e) =>
                        handleSaveSettings({ lowPriorityWeight: parseFloat(e.target.value) || 0.25 })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xl font-black text-slate-300 focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-400">Default: 0.25x chance</p>
                  </div>
                </div>

                {/* Physics & Spin Settings */}
                <div className="pt-4 border-t border-slate-800 space-y-4">
                  <h4 className="font-bold text-sm text-slate-200">Wheel Animation Physics</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                      <label className="text-xs text-slate-300 font-medium">
                        Spin Duration ({localSettings.spinDuration} seconds)
                      </label>
                      <input
                        type="range"
                        min="3"
                        max="10"
                        value={localSettings.spinDuration}
                        onChange={(e) =>
                          handleSaveSettings({ spinDuration: parseInt(e.target.value) || 5 })
                        }
                        className="w-full accent-indigo-500"
                      />
                    </div>

                    <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                      <label className="text-xs text-slate-300 font-medium">
                        Minimum Full Rotations ({localSettings.minRotations} turns)
                      </label>
                      <input
                        type="range"
                        min="3"
                        max="15"
                        value={localSettings.minRotations}
                        onChange={(e) =>
                          handleSaveSettings({ minRotations: parseInt(e.target.value) || 6 })
                        }
                        className="w-full accent-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Secret Manipulation Controls */}
            {activeTab === 'secret' && (
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-extrabold text-purple-300 text-base">
                      Secret Outcome Controls
                    </h3>
                    <p className="text-xs text-purple-200/70 mt-1">
                      These settings secretly force or tilt the spin outcome while maintaining a completely normal, smooth visual wheel spin animation.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Feature 1: Randomize within High Priority */}
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                        <span>Randomize within High Priority</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        When enabled, winner is strictly picked from High Priority names only.
                      </p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.randomizeWithinHighPriority}
                        onChange={(e) =>
                          handleSaveSettings({ randomizeWithinHighPriority: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
                    </label>
                  </div>

                  {/* Feature 2: Predetermined Winner */}
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                    <div>
                      <h4 className="font-bold text-sm text-slate-100">Predetermined Winner</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Secretly select an explicit winner. The wheel will execute a realistic multi-rotation spin and decelerate smoothly right onto this person!
                      </p>
                    </div>

                    <select
                      value={localSettings.predeterminedWinnerId || ''}
                      onChange={(e) =>
                        handleSaveSettings({
                          predeterminedWinnerId: e.target.value ? e.target.value : null,
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 font-semibold focus:outline-none focus:border-purple-500"
                    >
                      <option value="">-- None (Normal Weighted Wheel) --</option>
                      {localNames
                        .filter((n) => n.enabled)
                        .map((n) => (
                          <option key={n.id} value={n.id}>
                            {n.name} ({n.priority.toUpperCase()})
                          </option>
                        ))}
                    </select>

                    {localSettings.predeterminedWinnerId && (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span>
                          Active Secret Winner:{' '}
                          <strong>
                            {localNames.find((n) => n.id === localSettings.predeterminedWinnerId)?.name}
                          </strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: Security & PIN */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-slate-100 text-base">Passcode Lock Configuration</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Protect the advanced settings panel from normal users with a passcode.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-200">PIN Protection Status</h4>
                      <p className="text-xs text-slate-400">Require PIN before opening settings</p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.pinProtected}
                        onChange={(e) =>
                          handleSaveSettings({ pinProtected: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
                    </label>
                  </div>

                  {localSettings.pinProtected && (
                    <div className="space-y-2 pt-3 border-t border-slate-800">
                      <label className="text-xs font-semibold text-slate-300">
                        Admin Passcode PIN (Numeric)
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={localSettings.pinCode}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (val) handleSaveSettings({ pinCode: val });
                        }}
                        className="w-full max-w-xs bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-lg font-mono tracking-widest text-indigo-300 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: Data Backup & Import/Export */}
            {activeTab === 'data' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-slate-100 text-base">Import & Export Configuration</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Backup or restore your names, priority settings, and wheel configuration.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Export */}
                  <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                    <Download className="w-6 h-6 text-indigo-400" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-200">Export JSON</h4>
                      <p className="text-xs text-slate-400">Download current configuration file.</p>
                    </div>
                    <button
                      onClick={handleExportJSON}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl text-xs transition-all shadow-lg shadow-indigo-600/20"
                    >
                      Export File
                    </button>
                  </div>

                  {/* Import */}
                  <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                    <Upload className="w-6 h-6 text-indigo-400" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-200">Import JSON</h4>
                      <p className="text-xs text-slate-400">Upload JSON backup file.</p>
                    </div>
                    <label className="block w-full text-center bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2.5 rounded-xl text-xs transition-colors cursor-pointer">
                      Select JSON File
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportFile}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Reset & Clear buttons */}
                <div className="pt-6 border-t border-slate-800 space-y-3">
                  <h4 className="font-bold text-sm text-rose-400">Danger Zone</h4>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => {
                        onResetAll();
                        showToast('success', 'Reset all settings to default.');
                      }}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset All Settings</span>
                    </button>

                    <button
                      onClick={() => setShowConfirmClear(true)}
                      className="flex-1 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-300 font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear All Names</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Confirmation modal for Clear All Names */}
        {showConfirmClear && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
              <div className="inline-flex p-3 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-lg text-slate-100">Clear All Names?</h4>
              <p className="text-xs text-slate-400">
                This will delete all names from the wheel. Are you sure?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onClearNames();
                    setLocalNames([]);
                    setShowConfirmClear(false);
                    showToast('success', 'Cleared all names.');
                  }}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-2.5 rounded-xl text-xs font-semibold shadow-lg shadow-rose-600/30"
                >
                  Confirm Clear
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
