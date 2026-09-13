import { useState } from 'react';
import type { NameItem, NamePriority } from '../types';

import { Plus, Trash2, Shuffle, CheckSquare, Square, Search, Edit2, Check, X, FileText } from 'lucide-react';

interface NameListProps {
  names: NameItem[];
  onAddName: (name: string, priority?: NamePriority) => void;
  onAddBulkNames: (rawText: string) => void;
  onToggleEnabled: (id: string) => void;
  onDeleteName: (id: string) => void;
  onUpdateName: (id: string, newName: string) => void;
  onShuffleNames: () => void;
  onSetAllEnabled: (enabled: boolean) => void;
  disabled?: boolean;
}

export const NameList = ({
  names,
  onAddName,
  onAddBulkNames,
  onToggleEnabled,
  onDeleteName,
  onUpdateName,
  onShuffleNames,
  onSetAllEnabled,
  disabled = false,
}: NameListProps) => {

  const [inputVal, setInputVal] = useState('');
  const [searchVal, setSearchVal] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState('');

  const activeCount = names.filter((n) => n.enabled).length;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || disabled) return;
    onAddName(inputVal.trim());
    setInputVal('');
  };

  const handleStartEdit = (item: NameItem) => {
    if (disabled) return;
    setEditingId(item.id);
    setEditingText(item.name);
  };

  const handleSaveEdit = (id: string) => {
    if (editingText.trim()) {
      onUpdateName(id, editingText.trim());
    }
    setEditingId(null);
  };

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkText.trim()) {
      onAddBulkNames(bulkText);
      setBulkText('');
      setShowBulkModal(false);
    }
  };

  const filteredNames = names.filter((n) =>
    n.name.toLowerCase().includes(searchVal.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Header Bar */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-lg text-slate-100 flex items-center gap-2">
            <span>🎯 Names</span>
            <span className="text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full">
              {activeCount} / {names.length} active
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onShuffleNames}
            disabled={disabled || names.length < 2}
            title="Shuffle Names"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Shuffle className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowBulkModal(true)}
            disabled={disabled}
            title="Bulk Add Names"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-40"
          >
            <FileText className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Add Name Input */}
      <form onSubmit={handleAddSubmit} className="p-4 border-b border-slate-800 bg-slate-950/20">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Type a name & press Enter..."
            disabled={disabled}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={disabled || !inputVal.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>
      </form>

      {/* Search & Quick Toggles */}
      {names.length > 5 && (
        <div className="px-4 py-2 bg-slate-950/30 border-b border-slate-800/80 flex items-center justify-between gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Filter names..."
              className="w-full bg-slate-950/80 border border-slate-800/80 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onSetAllEnabled(true)}
              className="text-[11px] text-indigo-400 hover:underline px-1.5"
            >
              Select All
            </button>
            <span className="text-slate-600 text-xs">|</span>
            <button
              onClick={() => onSetAllEnabled(false)}
              className="text-[11px] text-slate-400 hover:underline px-1.5"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* List of Names */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[380px] sm:max-h-[460px] custom-scrollbar">
        {filteredNames.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-sm">
            {names.length === 0 ? 'No names added yet. Enter names above!' : 'No names match your search.'}
          </div>
        ) : (
          filteredNames.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border transition-all ${
                item.enabled
                  ? 'bg-slate-800/50 border-slate-700/60 hover:border-slate-600 text-slate-200'
                  : 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-60'
              }`}
            >
              {/* Checkbox & Color Chip */}
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => onToggleEnabled(item.id)}
                  disabled={disabled}
                  className="text-slate-400 hover:text-indigo-400 transition-colors focus:outline-none"
                >
                  {item.enabled ? (
                    <CheckSquare className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-600" />
                  )}
                </button>

                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />

                {/* Name Label or Edit Input */}
                {editingId === item.id ? (
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(item.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                      className="bg-slate-950 border border-indigo-500 rounded px-2 py-0.5 text-xs text-white flex-1 focus:outline-none"
                    />
                    <button
                      onClick={() => handleSaveEdit(item.id)}
                      className="p-1 text-emerald-400 hover:text-emerald-300"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1 text-slate-400 hover:text-slate-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span
                    onDoubleClick={() => handleStartEdit(item)}
                    className={`text-sm font-medium truncate flex-1 ${
                      !item.enabled ? 'line-through' : ''
                    }`}
                  >
                    {item.name}
                  </span>
                )}
              </div>

              {/* Action Icons */}
              {editingId !== item.id && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(item)}
                    disabled={disabled}
                    className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-700/50 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteName(item.id)}
                    disabled={disabled}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Bulk Add Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-100 text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                Bulk Add Names
              </h3>
              <button
                onClick={() => setShowBulkModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Paste multiple names below (separated by lines or commas).
            </p>
            <form onSubmit={handleBulkSubmit} className="space-y-4">
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={"Rahul\nSophia\nAlex\nEmma"}
                rows={6}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!bulkText.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 disabled:opacity-40"
                >
                  Add All Names
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
