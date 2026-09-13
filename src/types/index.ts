export type NamePriority = 'high' | 'normal' | 'low';

export interface NameItem {
  id: string;
  name: string;
  enabled: boolean;
  priority: NamePriority;
  weight?: number;
  color: string;
}

export interface AppSettings {
  // Weight multipliers
  highPriorityWeight: number;
  normalPriorityWeight: number;
  lowPriorityWeight: number;

  // Secret / Advanced strategy toggles
  randomizeWithinHighPriority: boolean;
  predeterminedWinnerId: string | null;

  // Security
  pinProtected: boolean;
  pinCode: string;

  // Wheel & Audio preferences
  soundEnabled: boolean;
  spinDuration: number; // in seconds
  minRotations: number;
  theme: 'dark' | 'light' | 'neon';
}

export interface SpinResult {
  winner: NameItem;
  timestamp: number;
}

export interface ExportData {
  version: string;
  exportedAt: string;
  names: NameItem[];
  settings: Partial<AppSettings>;
}
