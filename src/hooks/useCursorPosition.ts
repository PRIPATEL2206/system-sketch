import { useEffect, useRef } from 'react';

/**
 * Tracks the last known mouse position in client coordinates.
 * Used as the paste anchor so Ctrl/Cmd+V drops near the cursor without
 * requiring the user to right-click.
 */
export function useCursorPosition() {
  const ref = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      ref.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handler, { passive: true });
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  return ref;
}
