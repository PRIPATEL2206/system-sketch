import { useGraphCounts } from '@/store';

/**
 * Tiny node/edge counter at the bottom-center of the canvas. Re-renders
 * only when counts change (focused selector). Useful to confirm the
 * graph size matches expectations and as a sanity check during exports.
 */
export function StatsPill() {
  const { nodes, edges } = useGraphCounts();
  if (nodes === 0 && edges === 0) return null;
  return (
    <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2">
      <div className="rounded-full border bg-card/85 px-2.5 py-0.5 text-[10px] tracking-wide text-muted-foreground shadow-sm backdrop-blur">
        {nodes} {nodes === 1 ? 'node' : 'nodes'} · {edges}{' '}
        {edges === 1 ? 'edge' : 'edges'}
      </div>
    </div>
  );
}
