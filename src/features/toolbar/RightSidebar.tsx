import { useState } from 'react';
import { ChevronsLeft, ChevronsRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { EdgePropertiesPanel } from '@/features/properties/EdgePropertiesPanel';
import { MultiSelectionPanel } from '@/features/properties/MultiSelectionPanel';
import { PropertiesPanel } from '@/features/properties/PropertiesPanel';
import {
  useSelectedEdge,
  useSelectedEdgeEndpoints,
  useSelectedNode,
  useSelectionCount,
  useStore,
} from '@/store';

interface RightSidebarProps {
  /** Triggered when delete is requested for a large multi-selection. */
  onRequestBulkDelete: (count: number) => void;
}

export function RightSidebar({ onRequestBulkDelete }: RightSidebarProps) {
  const selectedNode = useSelectedNode();
  const selectedEdge = useSelectedEdge();
  const endpoints = useSelectedEdgeEndpoints();
  const { nodes: nodeCount } = useSelectionCount();

  const patchNode = useStore((s) => s.patchNode);
  const patchNodeCoalesced = useStore((s) => s.patchNodeCoalesced);
  const removeNode = useStore((s) => s.removeNode);
  const patchEdge = useStore((s) => s.patchEdge);
  const patchEdgeCoalesced = useStore((s) => s.patchEdgeCoalesced);
  const removeEdge = useStore((s) => s.removeEdge);
  const removeNodes = useStore((s) => s.removeNodes);
  const selectedNodeIds = useStore((s) => s.selectedNodeIds);

  const [collapsed, setCollapsed] = useState(false);

  const handleMultiDelete = () => {
    if (nodeCount > 20) {
      onRequestBulkDelete(nodeCount);
    } else {
      removeNodes(selectedNodeIds);
    }
  };

  if (collapsed) {
    return (
      <TooltipProvider delayDuration={150}>
        <aside className="flex w-12 shrink-0 flex-col items-center border-l bg-card py-2 transition-[width] duration-200">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCollapsed(false)}
                aria-label="Expand properties panel"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Expand properties</TooltipContent>
          </Tooltip>
        </aside>
      </TooltipProvider>
    );
  }

  // Render priority: multi-selection (2+ nodes) > single edge > single node > empty.
  const showMulti = nodeCount >= 2;

  return (
    <TooltipProvider delayDuration={150}>
      <aside className="flex w-72 shrink-0 flex-col border-l bg-card transition-[width] duration-200">
        <div className="flex items-center justify-between border-b p-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {showMulti ? 'Selection' : 'Properties'}
          </h2>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setCollapsed(true)}
                aria-label="Collapse properties panel"
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Collapse</TooltipContent>
          </Tooltip>
        </div>

        {showMulti ? (
          <MultiSelectionPanel
            selectionCount={nodeCount}
            onRequestDelete={handleMultiDelete}
          />
        ) : selectedEdge && endpoints ? (
          <EdgePropertiesPanel
            edge={selectedEdge}
            sourceLabel={endpoints.source}
            targetLabel={endpoints.target}
            onPatch={patchEdge}
            onPatchCoalesced={patchEdgeCoalesced}
            onDelete={removeEdge}
          />
        ) : selectedNode ? (
          <PropertiesPanel
            node={selectedNode}
            onPatch={patchNode}
            onPatchCoalesced={patchNodeCoalesced}
            onDelete={removeNode}
          />
        ) : (
          <div className="scrollbar-thin flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground animate-fade-in">
            <Info className="h-5 w-5" />
            <p className="text-xs">
              Select a node or edge — or hold{' '}
              <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px]">Shift</kbd>{' '}
              and drag to lasso multiple.
            </p>
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}
