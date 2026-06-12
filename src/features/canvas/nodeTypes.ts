import type { NodeTypes } from 'reactflow';
import { SystemNode } from '@/features/nodes/SystemNode';
import { StickyNode } from '@/features/nodes/StickyNode';
import { TextNode } from '@/features/nodes/TextNode';

/**
 * IMPORTANT: must be defined at module scope. React Flow throws a console
 * warning ("nodeTypes prop is recreated") and re-mounts every node on each
 * render if this object is created inline in JSX.
 */
export const nodeTypes: NodeTypes = {
  system: SystemNode,
  sticky: StickyNode,
  text: TextNode,
};
