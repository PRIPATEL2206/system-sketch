import { useCallback, useRef, useState } from 'react';
import {
  ChevronDown,
  Download,
  FileImage,
  FileJson,
  FileText,
  Focus,
  Image as ImageIcon,
  Keyboard,
  LayoutTemplate,
  Moon,
  Redo2,
  Save,
  Sun,
  Undo2,
  Upload,
  Workflow,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTheme } from '@/hooks/useTheme';
import {
  ProjectIOError,
  exportImage,
  importProjectFromFile,
  saveProjectAsJson,
} from '@/services/projectActions';
import { useHistoryAvailability, useStore } from '@/store';

interface TopBarProps {
  projectName: string;
  onProjectNameChange: (next: string) => void;
  onShowShortcuts: () => void;
  onShowTemplates: () => void;
}

interface IconButtonProps {
  label: string;
  shortcut?: string;
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

function IconButton({ label, shortcut, icon, onClick, disabled }: IconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <span>{label}</span>
        {shortcut ? (
          <span className="ml-2 text-[10px] opacity-70">{shortcut}</span>
        ) : null}
      </TooltipContent>
    </Tooltip>
  );
}

export function TopBar({
  projectName,
  onProjectNameChange,
  onShowShortcuts,
  onShowTemplates,
}: TopBarProps) {
  const { theme, toggle } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ text: string; tone: 'info' | 'error' } | null>(
    null,
  );
  const { canUndo, canRedo } = useHistoryAvailability();
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);

  const flashStatus = (text: string, tone: 'info' | 'error' = 'info') => {
    setStatus({ text, tone });
    window.setTimeout(() => setStatus(null), 2400);
  };

  const handleSave = useCallback(() => {
    const filename = saveProjectAsJson();
    if (filename) flashStatus(`Saved ${filename}`);
  }, []);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChosen = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // reset so re-importing the same file fires `change`
    if (!file) return;
    try {
      await importProjectFromFile(file);
      flashStatus(`Imported ${file.name} — undo history reset`);
    } catch (err) {
      const msg =
        err instanceof ProjectIOError
          ? `Import failed — ${err.message}`
          : `Import failed — ${err instanceof Error ? err.message : String(err)}`;
      flashStatus(msg, 'error');
    }
  }, []);

  const handleExport = useCallback(async (format: 'png' | 'svg' | 'pdf') => {
    try {
      const filename = await exportImage(format);
      flashStatus(`Exported ${filename}`);
    } catch (err) {
      flashStatus(
        `Export failed — ${err instanceof Error ? err.message : String(err)}`,
        'error',
      );
    }
  }, []);

  return (
    <TooltipProvider delayDuration={150}>
      <header className="flex h-12 items-center justify-between border-b bg-card px-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Workflow className="h-4 w-4" />
          </div>
          <input
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            className="w-56 rounded-md bg-transparent px-2 py-1 text-sm font-medium outline-none hover:bg-accent focus:bg-accent"
            aria-label="Project name"
          />
          {status ? (
            <span
              role="status"
              className={
                status.tone === 'error'
                  ? 'ml-2 max-w-xs truncate rounded-full border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-[11px] text-destructive animate-slide-in-right'
                  : 'ml-2 max-w-xs truncate rounded-full border bg-muted/60 px-2 py-0.5 text-[11px] text-muted-foreground animate-slide-in-right'
              }
            >
              {status.text}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFileChosen}
            className="hidden"
          />

          <IconButton
            label="Undo"
            shortcut="Ctrl+Z"
            icon={<Undo2 className="h-4 w-4" />}
            onClick={undo}
            disabled={!canUndo}
          />
          <IconButton
            label="Redo"
            shortcut="Ctrl+Shift+Z"
            icon={<Redo2 className="h-4 w-4" />}
            onClick={redo}
            disabled={!canRedo}
          />
          <Separator orientation="vertical" className="mx-1 h-6" />

          <IconButton
            label="Import JSON"
            icon={<Upload className="h-4 w-4" />}
            onClick={handleImportClick}
          />
          <IconButton
            label="Save JSON"
            shortcut="Ctrl+S"
            icon={<Save className="h-4 w-4" />}
            onClick={handleSave}
          />

          {/* Export dropdown ------------------------------------------------ */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Diagram</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => handleExport('png')}>
                <span className="flex items-center gap-2">
                  <ImageIcon className="h-3.5 w-3.5" /> PNG image
                </span>
                <span className="text-[10px] opacity-60">Ctrl+E</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleExport('svg')}>
                <span className="flex items-center gap-2">
                  <FileImage className="h-3.5 w-3.5" /> SVG image
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleExport('pdf')}>
                <span className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5" /> PDF document
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Project</DropdownMenuLabel>
              <DropdownMenuItem onSelect={handleSave}>
                <span className="flex items-center gap-2">
                  <FileJson className="h-3.5 w-3.5" /> JSON config
                </span>
                <span className="text-[10px] opacity-60">Ctrl+S</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="mx-1 h-6" />
          <IconButton
            label="Templates"
            shortcut="T"
            icon={<LayoutTemplate className="h-4 w-4" />}
            onClick={onShowTemplates}
          />
          <IconButton
            label="Focus mode"
            shortcut="F"
            icon={<Focus className="h-4 w-4" />}
            onClick={() => useStore.getState().toggleFocusMode()}
          />
          <IconButton
            label="Keyboard shortcuts"
            shortcut="?"
            icon={<Keyboard className="h-4 w-4" />}
            onClick={onShowShortcuts}
          />
          <IconButton
            label={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
            icon={
              theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )
            }
            onClick={toggle}
          />
        </div>
      </header>
    </TooltipProvider>
  );
}
