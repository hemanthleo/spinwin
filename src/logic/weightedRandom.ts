import type { NameItem, AppSettings } from '../types';


export interface SelectionResult {
  winner: NameItem;
  winnerIndexInEnabled: number;
  winnerIndexInAll: number;
  strategy: 'predetermined' | 'high_priority_random' | 'weighted';
  calculatedWeight: number;
  totalWeight: number;
  probabilityPercentage: number;
}

export function getItemWeight(item: NameItem, settings: AppSettings): number {
  if (typeof item.weight === 'number' && item.weight > 0) {
    return item.weight;
  }
  switch (item.priority) {
    case 'high':
      return settings.highPriorityWeight > 0 ? settings.highPriorityWeight : 5;
    case 'low':
      return settings.lowPriorityWeight > 0 ? settings.lowPriorityWeight : 0.25;
    case 'normal':
    default:
      return settings.normalPriorityWeight > 0 ? settings.normalPriorityWeight : 1;
  }
}

export function selectWinner(
  allNames: NameItem[],
  settings: AppSettings
): SelectionResult | null {
  // 1. Filter enabled names
  const enabledNames = allNames.filter((n) => n.enabled);
  if (enabledNames.length === 0) return null;

  // Single name edge case
  if (enabledNames.length === 1) {
    const single = enabledNames[0];
    const weight = getItemWeight(single, settings);
    return {
      winner: single,
      winnerIndexInEnabled: 0,
      winnerIndexInAll: allNames.findIndex((n) => n.id === single.id),
      strategy: 'weighted',
      calculatedWeight: weight,
      totalWeight: weight,
      probabilityPercentage: 100,
    };
  }

  // Calculate total weights for probability breakdown
  const itemsWithWeight = enabledNames.map((item) => ({
    item,
    weight: getItemWeight(item, settings),
  }));
  const totalWeight = itemsWithWeight.reduce((sum, i) => sum + i.weight, 0);

  // Strategy 1: Predetermined Winner
  if (settings.predeterminedWinnerId) {
    const predIdx = enabledNames.findIndex(
      (n) => n.id === settings.predeterminedWinnerId
    );
    if (predIdx !== -1) {
      const winner = enabledNames[predIdx];
      const weight = getItemWeight(winner, settings);
      return {
        winner,
        winnerIndexInEnabled: predIdx,
        winnerIndexInAll: allNames.findIndex((n) => n.id === winner.id),
        strategy: 'predetermined',
        calculatedWeight: weight,
        totalWeight,
        probabilityPercentage: totalWeight > 0 ? (weight / totalWeight) * 100 : 0,
      };
    }
  }

  // Strategy 2: Randomize within High Priority
  if (settings.randomizeWithinHighPriority) {
    const highPriorityItems = enabledNames.filter((n) => n.priority === 'high');
    if (highPriorityItems.length > 0) {
      const randomIndex = Math.floor(Math.random() * highPriorityItems.length);
      const winner = highPriorityItems[randomIndex];
      const winnerIndexInEnabled = enabledNames.findIndex((n) => n.id === winner.id);
      const weight = getItemWeight(winner, settings);
      return {
        winner,
        winnerIndexInEnabled,
        winnerIndexInAll: allNames.findIndex((n) => n.id === winner.id),
        strategy: 'high_priority_random',
        calculatedWeight: weight,
        totalWeight,
        probabilityPercentage: 100 / highPriorityItems.length,
      };
    }
  }

  // Strategy 3: Weighted Random Selection
  const randomVal = Math.random() * totalWeight;
  let cumulativeWeight = 0;
  let selectedEntry = itemsWithWeight[0];
  let selectedIndex = 0;

  for (let i = 0; i < itemsWithWeight.length; i++) {
    cumulativeWeight += itemsWithWeight[i].weight;
    if (randomVal <= cumulativeWeight) {
      selectedEntry = itemsWithWeight[i];
      selectedIndex = i;
      break;
    }
  }

  return {
    winner: selectedEntry.item,
    winnerIndexInEnabled: selectedIndex,
    winnerIndexInAll: allNames.findIndex((n) => n.id === selectedEntry.item.id),
    strategy: 'weighted',
    calculatedWeight: selectedEntry.weight,
    totalWeight,
    probabilityPercentage: totalWeight > 0 ? (selectedEntry.weight / totalWeight) * 100 : 0,
  };
}
