import { useEffect } from 'react';
import { useGraphCounts } from '@/store';

/** Beyond this size, entrance keyframes hurt more than they help. */
export const ENTRANCE_THRESHOLD = 200;

/**
 * Toggles `body.entrance-animations` based on graph size so the per-node
 * pop animation runs for normal-sized canvases and disappears on large
 * imports.
 */
export function useEntranceAnimations() {
  const { nodes } = useGraphCounts();
  useEffect(() => {
    const enabled = nodes < ENTRANCE_THRESHOLD;
    document.body.classList.toggle('entrance-animations', enabled);
    return () => {
      document.body.classList.remove('entrance-animations');
    };
  }, [nodes]);
}
