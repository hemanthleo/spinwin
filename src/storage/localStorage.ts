import type { NameItem, AppSettings, ExportData } from '../types';


export const SLICE_COLORS = [
  '#6366F1', // Indigo
  '#EC4899', // Pink
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#EF4444', // Red
  '#3B82F6', // Blue
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#A855F7', // Violet
  '#84CC16', // Lime
];

export const DEFAULT_NAMES: NameItem[] = [
  { id: 'name-1', name: 'Rahul', enabled: true, priority: 'high', color: '#6366F1' },
  { id: 'name-2', name: 'Sophia', enabled: true, priority: 'normal', color: '#EC4899' },
  { id: 'name-3', name: 'Alex', enabled: true, priority: 'normal', color: '#10B981' },
  { id: 'name-4', name: 'Emma', enabled: true, priority: 'low', color: '#F59E0B' },
  { id: 'name-5', name: 'Liam', enabled: true, priority: 'normal', color: '#8B5CF6' },
  { id: 'name-6', name: 'Olivia', enabled: true, priority: 'normal', color: '#06B6D4' },
  { id: 'name-7', name: 'Noah', enabled: true, priority: 'high', color: '#EF4444' },
  { id: 'name-8', name: 'Ava', enabled: true, priority: 'normal', color: '#3B82F6' },
];

export const DEFAULT_SETTINGS: AppSettings = {
  highPriorityWeight: 5,
  normalPriorityWeight: 1,
  lowPriorityWeight: 0.25,

  randomizeWithinHighPriority: false,
  predeterminedWinnerId: null,

  pinProtected: true,
  pinCode: '1234',

  soundEnabled: true,
  spinDuration: 5,
  minRotations: 6,
  theme: 'dark',
};

const NAMES_STORAGE_KEY = 'spin_a_name_items_v1';
const SETTINGS_STORAGE_KEY = 'spin_a_name_settings_v1';

export function loadStoredNames(): NameItem[] {
  try {
    const raw = localStorage.getItem(NAMES_STORAGE_KEY);
    if (!raw) return DEFAULT_NAMES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item, idx) => ({
        ...item,
        color: item.color || SLICE_COLORS[idx % SLICE_COLORS.length],
        priority: item.priority || 'normal',
        enabled: item.enabled !== undefined ? item.enabled : true,
      }));
    }
  } catch (e) {
    console.error('Failed to load names from localStorage', e);
  }
  return DEFAULT_NAMES;
}

export function saveStoredNames(names: NameItem[]): void {
  try {
    localStorage.setItem(NAMES_STORAGE_KEY, JSON.stringify(names));
  } catch (e) {
    console.error('Failed to save names to localStorage', e);
  }
}

export function loadStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
    };
  } catch (e) {
    console.error('Failed to load settings from localStorage', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveStoredSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings to localStorage', e);
  }
}

export function exportConfiguration(names: NameItem[], settings: AppSettings): string {
  const exportData: ExportData = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    names,
    settings: {
      highPriorityWeight: settings.highPriorityWeight,
      normalPriorityWeight: settings.normalPriorityWeight,
      lowPriorityWeight: settings.lowPriorityWeight,
      randomizeWithinHighPriority: settings.randomizeWithinHighPriority,
      predeterminedWinnerId: settings.predeterminedWinnerId,
      pinProtected: settings.pinProtected,
      soundEnabled: settings.soundEnabled,
      spinDuration: settings.spinDuration,
      minRotations: settings.minRotations,
    },
  };
  return JSON.stringify(exportData, null, 2);
}

export function validateAndImportConfiguration(jsonString: string): { names: NameItem[]; settings: Partial<AppSettings> } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid JSON structure');
    }

    // Support both direct array of names OR standard ExportData object
    let namesArray: any[] = [];
    let settingsObj: Partial<AppSettings> = {};

    if (Array.isArray(parsed)) {
      namesArray = parsed;
    } else if (Array.isArray(parsed.names)) {
      namesArray = parsed.names;
      if (parsed.settings && typeof parsed.settings === 'object') {
        settingsObj = parsed.settings;
      }
    } else {
      throw new Error('JSON format must contain a valid "names" array');
    }

    const validatedNames: NameItem[] = namesArray.map((item: any, idx: number) => {
      if (!item || typeof item.name !== 'string' || !item.name.trim()) {
        throw new Error(`Invalid name entry at position ${idx + 1}`);
      }
      return {
        id: item.id || `imported-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        name: item.name.trim(),
        enabled: item.enabled !== undefined ? Boolean(item.enabled) : true,
        priority: ['high', 'normal', 'low'].includes(item.priority) ? item.priority : 'normal',
        weight: typeof item.weight === 'number' && item.weight > 0 ? item.weight : undefined,
        color: item.color || SLICE_COLORS[idx % SLICE_COLORS.length],
      };
    });

    if (validatedNames.length === 0) {
      throw new Error('Configuration contains no valid names');
    }

    return {
      names: validatedNames,
      settings: settingsObj,
    };
  } catch (e: any) {
    throw new Error(e.message || 'Failed to parse JSON file');
  }
}
