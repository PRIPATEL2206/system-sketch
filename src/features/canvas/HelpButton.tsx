import { Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface HelpButtonProps {
  onClick: () => void;
}

/**
 * Small floating button anchored above the React Flow controls. Opens
 * the keyboard-shortcuts dialog. Visible discoverability for "?".
 */
export function HelpButton({ onClick }: HelpButtonProps) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
            aria-label="Keyboard shortcuts"
            className="absolute bottom-3 right-[calc(2.75rem+0.75rem)] z-10 h-8 w-8 rounded-md border bg-card/85 shadow-sm backdrop-blur"
          >
            <Keyboard className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <span>Keyboard shortcuts</span>
          <span className="ml-2 text-[10px] opacity-70">?</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
