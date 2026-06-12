import type { SystemNodeGroup } from '@/types';

let counter = 0;

export function makeGroupId(): string {
  counter += 1;
  return `g_${counter.toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
}

const GROUP_COLORS = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#0ea5e9',
  '#a855f7',
  '#14b8a6',
] as const;

export function pickGroupColor(seed: number): string {
  return GROUP_COLORS[Math.abs(seed) % GROUP_COLORS.length];
}

export function createGroup(label = 'Group', seed = 0): SystemNodeGroup {
  return {
    id: makeGroupId(),
    label,
    color: pickGroupColor(seed),
    collapsed: false,
  };
}
