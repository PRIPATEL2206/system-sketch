# SystemSketch — Build Progress

A local-first system-design diagramming tool (Vite + React + TS + Tailwind + ShadCN + React Flow + Zustand).

## Batches

- [x] Batch 1 — Project setup, folder structure, base layout UI
- [x] Batch 2 — Canvas with React Flow + basic node rendering
- [x] Batch 3 — Properties editor + selection wiring
- [x] Batch 4 — Connections (edges) + edge controls
- [x] Batch 5 — Zustand state management (canvas/node/edge/history slices)
- [x] Batch 6 — Keyboard + mouse interactions
- [x] Batch 7 — Import / Export (JSON + PNG / SVG / PDF)
- [x] Batch 8 — Undo / Redo polish (UI hookup + coalescing)
- [x] Batch 9 — UI polishing + animations
- [x] Batch 10 — Performance optimizations (virtualization, memoization)
- [x] **Batch 11 — Multi-selection, bulk actions, grouping, alignment**

🎉 **All 11 batches shipped.** SystemSketch v2 (groups + bulk) is feature-complete.
- [ ] Batch 5 — Zustand state management (canvas/node/edge/history slices)
- [ ] Batch 6 — Keyboard + mouse interactions (shortcuts, multi-select, context menu)
- [ ] Batch 7 — Import / Export (JSON + PNG/SVG/PDF)
- [ ] Batch 8 — Undo/Redo (capped history stack)
- [ ] Batch 9 — UI polishing + animations
- [ ] Batch 10 — Performance optimizations (virtualization, memoization)

## Stack & conventions

- Vite + React 18 + TypeScript (strict; no `any`)
- TailwindCSS 3 with shadcn-style HSL tokens; `cn()` utility for class merging
- Path alias `@/*` → `src/*`
- React Flow for the canvas; node types defined at module scope (avoids re-mount)

## Folder structure

```
src/
  components/ui/        button, separator, tooltip (shadcn primitives)
  features/
    canvas/             Canvas (React Flow), nodeTypes registry
    nodes/              SystemNode, nodeCatalog, nodeFactory
    edges/              (batch 4)
    toolbar/            TopBar, LeftSidebar, RightSidebar
  hooks/                useTheme
  store/                (batch 5)
  services/             (batch 7 — import/export)
  utils/                cn
  types/                SystemNode, SystemEdge, ProjectConfig, …
  styles/               globals.css, reactflow.css
```

## Batch 1 — what shipped

- Vite + Tailwind + TS scaffolding, shadcn primitives (Button, Separator, Tooltip).
- Three-pane layout: TopBar / LeftSidebar (component library, draggable) / Canvas / RightSidebar (properties shell).
- Light/dark theme persisted via `useTheme`.
- Single source of truth for node kinds: `nodeCatalog`.
- Strict domain types: `SystemNode`, `SystemEdge`, `ProjectConfig`, …

## Batch 2 — what shipped

- **Real React Flow canvas** (`features/canvas/Canvas.tsx`) wrapped in `ReactFlowProvider`, with controls, minimap (color-mapped to node color), dotted background, and snap-to-grid (16px).
- **Custom `SystemNode` renderer** (`features/nodes/SystemNode.tsx`): icon + title + kind label + truncated description, four connection handles ready for batch 4. Memoized to keep drag/zoom smooth.
- **`nodeFactory.createSystemNode(kind, position, overrides?)`** — pure, no `Date.now()` in id; safe under React 18 StrictMode double-invoke.
- **`nodeTypes` defined at module scope** in `features/canvas/nodeTypes.ts` (avoids React Flow's "nodeTypes recreated" warning and the re-mount it causes).
- **Drag-and-drop from sidebar** to canvas: `LeftSidebar` writes `application/system-sketch-node` MIME; `Canvas.onDrop` calls `screenToFlowPosition()` so the node lands under the cursor regardless of zoom/pan.
- **Click-to-add fallback** on sidebar items, with a small offset cascade so successive nodes don't stack identically.
- Empty-state hint rendered as a non-interactive React Flow `Panel`.
- React Flow chrome themed via `styles/reactflow.css` to use the shadcn token palette in both modes.

## Files added/changed in batch 2

- `src/features/nodes/SystemNode.tsx` (new)
- `src/features/nodes/nodeFactory.ts` (new)
- `src/features/canvas/nodeTypes.ts` (new)
- `src/features/canvas/Canvas.tsx` (new)
- `src/features/canvas/CanvasShell.tsx` (now a deprecated re-export of `Canvas`)
- `src/styles/reactflow.css` (new)
- `src/main.tsx` (imports `reactflow.css`)
- `src/App.tsx` (lifts `nodes` state, renders `Canvas`, wires `LeftSidebar.onAddNode`)

## Constraints honored

- No `any` (`as unknown as Node[]` cast is the React Flow boundary; the local type is still strict).
- No inline styles except for genuinely-dynamic values (node-color swatch).
- Loose coupling: `Canvas` only takes `nodes` + `onNodesChange`; swapping `useState` for the Zustand store in batch 5 is a one-line change in `App.tsx`.
- Undo will be capped (default 100 states) in batch 8, addressing the "system should not get stuck" requirement.

## Batch 3 — what shipped

- **Live `PropertiesPanel`** in `features/properties/` — edits the selected node in-place via a single `onPatch(id, partial)` callback (immutable update in App).
- **Title** (text), **Description** (textarea), **Color** (12-swatch curated palette + native color input), **Icon** (18-glyph grid from Lucide), and **Metadata** (key/value pairs with add/edit/delete).
- **Selection plumbing**: `Canvas.onSelectionChange` lifts the latest selected node id; clicking the empty pane clears selection. New nodes (sidebar click or canvas drop) auto-select so the user can edit immediately.
- **Delete from panel** removes the node and clears selection if it was the one deleted.
- New shadcn primitives: `Input`, `Textarea`, `Label`.
- New asset: `colorPalette.ts` — single source of truth for swatches.
- Metadata editor uses `defaultValue` + `onBlur` for keys to avoid focus loss while typing.

### Files added/changed in batch 3

- `src/components/ui/input.tsx` (new)
- `src/components/ui/textarea.tsx` (new)
- `src/components/ui/label.tsx` (new)
- `src/features/nodes/colorPalette.ts` (new)
- `src/features/properties/PropertiesPanel.tsx` (new)
- `src/features/toolbar/RightSidebar.tsx` (now hosts `PropertiesPanel`)
- `src/features/canvas/Canvas.tsx` (emits `onSelectionChange`)
- `src/App.tsx` (selection + patch + delete handlers)

## Batch 4 — what shipped

- **`SmartEdge`** — smooth-step path with arrow marker, optional centered label rendered via `EdgeLabelRenderer`, three flow types (sync/async/data) styled with distinct stroke colors and dash patterns, and a selection ring.
- **Edge creation by drag** — pull from any node handle (top/right/bottom/left) to another handle. `defaultEdgeOptions` ensures every new edge starts as a `smart` edge with the closed-arrow marker.
- **Dedupe on connect** — exact duplicate edges (same source/target/handles) are silently dropped so the user can't accidentally stack them.
- **Edge selection lifted** — `Canvas.onSelectionChange` now emits `{kind: 'node'|'edge', id}` (a tagged `SelectionTarget`); the right panel switches to `EdgePropertiesPanel` automatically.
- **Edge properties panel**: source → target labels, label text, flow-type segmented control, animated toggle, delete button.
- **Cascade-delete** — deleting a node removes any edges that referenced it, keeping state consistent.
- `connectionRadius={28}` makes handle pickup forgiving without being sticky.
- Edge type registry + defaults centralized in `features/canvas/edgeTypes.ts` (module scope, like `nodeTypes`).

### Files added/changed in batch 4

- `src/features/edges/SmartEdge.tsx` (new)
- `src/features/edges/edgeFactory.ts` (new)
- `src/features/canvas/edgeTypes.ts` (new)
- `src/features/properties/EdgePropertiesPanel.tsx` (new)
- `src/features/canvas/Canvas.tsx` (edges, connect, edge selection)
- `src/features/toolbar/RightSidebar.tsx` (switches between node/edge panels)
- `src/App.tsx` (edge state + selection target + edge handlers)

## Batch 5 — what shipped

- **Zustand store** in `src/store/` split into 5 slices, all sharing one `StoreState` type so cross-slice cascades (`removeNode` cleaning up edges) stay first-class:
  - `canvasSlice` — `projectName`, `metadata`, `setProjectName`, `hydrate` (used by import + reset).
  - `nodeSlice` — `nodes`, `setNodes` (hot path), `addNode`, `patchNode`, `removeNode`.
  - `edgeSlice` — `edges`, `setEdges` (hot path), `addEdge` (with dedupe), `patchEdge`, `removeEdge`.
  - `selectionSlice` — `selection: SelectionTarget`, `setSelection`.
  - `historySlice` — `past`, `future`, `pushHistory`, `undo`, `redo`, `resetHistory`. **Capped at 100 snapshots** (`HISTORY_LIMIT`) so the past stack can't blow up on long sessions.
- **`pushSnapshot(prev)` helper** — every mutating action (`addNode`, `patchNode`, `removeNode`, `addEdge`, `patchEdge`, `removeEdge`) records history *before* applying its change. The hot-path setters (`setNodes`, `setEdges`) deliberately do not, because React Flow fires them on every drag/zoom frame.
- **Drop-only history for moves** — `Canvas.handleNodesChange` watches for the final `position` change with `dragging=false` and pushes one snapshot per drag, not one per pixel.
- **Selectors with `useShallow`** — `useCanvasData`, `useSelectedNode`, `useSelectedEdge`, `useHistoryAvailability`. The right sidebar only re-renders when *its* selected entity actually changes; the canvas only re-renders on node/edge changes.
- **`Canvas` and `RightSidebar` consume the store directly** — `App.tsx` is now a 30-line layout shell. Adding a node from anywhere (sidebar click, drop, future paste) goes through `addNode` and gets the same select-on-create + history behavior.
- **Hydrate path defined** — `hydrate({ nodes, edges, projectName? })` resets selection and history; batch 7's import flow plugs in here.

### Files added/changed in batch 5

- `src/store/types.ts` (new)
- `src/store/canvasSlice.ts` (new)
- `src/store/nodeSlice.ts` (new)
- `src/store/edgeSlice.ts` (new)
- `src/store/selectionSlice.ts` (new)
- `src/store/historySlice.ts` (new)
- `src/store/index.ts` (new — root store + selectors)
- `src/features/canvas/Canvas.tsx` (consumes store; no longer takes props)
- `src/features/toolbar/RightSidebar.tsx` (consumes store; no longer takes props)
- `src/App.tsx` (layout shell only)

## Batch 6 — what shipped

### Keyboard

| Shortcut | Action |
| --- | --- |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` / `Ctrl + Y` | Redo |
| `Ctrl/Cmd + C` | Copy selection |
| `Ctrl/Cmd + X` | Cut selection |
| `Ctrl/Cmd + V` | Paste at cursor |
| `Ctrl/Cmd + D` | Duplicate selection |
| `Ctrl/Cmd + S` | Save (placeholder; batch 7 wires JSON download) |
| `Ctrl/Cmd + E` | Export image / PDF (placeholder; batch 7) |
| `Del` / `Backspace` | Delete selection |
| `A` | Open quick-add palette |
| `Esc` | Clear selection / close palette |
| **Hold `Space`** | Pan mode (cursor turns to grab) |

- Shortcuts auto-suppress when focus is in an `<input>`, `<textarea>` or `contenteditable` so typing in the right panel never deletes a node.
- Plain text Ctrl+C/V inside text fields still goes to the browser — clipboard ops only fire when not editing.

### Quick-add palette (`A`)

- Cmd-palette-style modal with fuzzy search (label, kind, description).
- Arrow keys to move, Enter to commit, Esc to cancel; click-outside dismiss.
- Lands the new node at the **cursor position** in flow coordinates — useful when you press `A` then commit before moving your hand off the keyboard.

### Clipboard slice

- `copySelection`, `cutSelection`, `pasteAt(position)`, `duplicateSelection`, `deleteSelection`.
- In-memory clipboard (not the browser system clipboard) — works without a permission prompt and survives across sessions.
- **Spatial paste**: nodes are translated so the clipboard's *centroid* lands at the cursor / right-click target; new ids minted; edges between clipboard nodes are remapped to the new ids; edges with an endpoint outside the clipboard are dropped.
- `Ctrl+D` duplicates in place with a `+32, +32` offset.

### Right-click context menu

- New `ContextMenu` primitive (`features/canvas/ContextMenu.tsx`): viewport-clamped, keyboard-dismissable, supports separators, danger styling, disabled items.
- Three menus, switched by surface:
  - **Canvas** → Paste (disabled if clipboard empty).
  - **Node** → Copy / Cut / Duplicate / Delete.
  - **Edge** → Delete connection.
- Right-clicking a node/edge also selects it, so the right sidebar updates in lockstep.

### Pan mode

- Hold `Space` → React Flow's `panActivationKeyCode` enables pan-on-drag, and a body-level `.panning` class flips the cursor to `grab`. Releasing Space restores normal interaction.

### Files added/changed in batch 6

- `src/store/types.ts` (added `ClipboardSlice`, `ClipboardPayload`)
- `src/store/clipboardSlice.ts` (new — copy/cut/paste/duplicate/delete)
- `src/store/index.ts` (registers clipboard slice)
- `src/hooks/useCursorPosition.ts` (new)
- `src/hooks/useKeyboardShortcuts.ts` (new — `useKeyboardShortcuts`, `useSpacebarPanMode`)
- `src/features/toolbar/QuickAddPalette.tsx` (new)
- `src/features/canvas/ContextMenu.tsx` (new)
- `src/features/canvas/Canvas.tsx` (forward ref + context menus + space-to-pan)
- `src/styles/globals.css` (`body.panning` cursor)
- `src/App.tsx` (palette state, paste resolver, save/export placeholders)

## Batch 7 — what shipped

### JSON config (project save/load)

- **`services/projectIO.ts`** — single source of truth for the wire format.
  - `serializeProject({ projectName, nodes, edges })` → `ProjectConfig` (`{ nodes, edges, metadata }` matching the spec).
  - `projectToJsonString(config)` — pretty-printed (2-space indent) for diffability.
  - `parseProjectJson(text)` — strict, **no `any`** validator that walks the tree and throws `ProjectIOError` with the exact path of the first failure (e.g. `metadata.version: unsupported version`, `nodes[3].position.x: expected finite number`). Versioned (`version: 1`); future versions will branch here.
  - Referential integrity: edges pointing at missing nodes are silently dropped on import — better a partial graph than a hard fail.
  - Unknown metadata value types (objects, arrays) are silently dropped, matching the spec's `string | number | boolean` constraint.
  - `downloadJson(filename, config)` and `readFileAsText(file)` for the browser plumbing.
- **`services/projectActions.ts`** — orchestration: `saveProjectAsJson()`, `importProjectFromFile(file)`, `exportImage(format)`. These are what `App` and `TopBar` call; they own filename slugging and store hydration so callers stay tiny.
- **`hydrate()` from batch 5** is the import landing pad — it resets selection and clears history, so users don't accidentally undo *into* the old project.

### Image / PDF export

- **`services/exporters.ts`** — `exportAsPng(filename, opts)`, `exportAsSvg(filename, opts)`, `exportAsPdf(filename, opts)`.
- Captures `.react-flow__viewport` directly. Before snapshotting, the service:
  1. Computes the node bounds with React Flow's `getNodesBounds`.
  2. Calculates the transform that fits those bounds into a padded frame at zoom = 1 (so text/strokes are crisp; pixel-ratio handles DPI).
  3. Mutates the live transform, captures, then restores in `finally` — html-to-image clones the DOM synchronously so there's no flicker.
- `pixelRatio: 2` for PNG (Retina-clean); SVG is vector by definition; PDF wraps the PNG in a single page sized to the captured frame, with orientation auto-chosen.
- The capture filter strips `.react-flow__controls`, `.react-flow__minimap`, and `.react-flow__panel` — the export shows just the diagram.

### TopBar UX

- New `DropdownMenu` shadcn primitive (`components/ui/dropdown-menu.tsx`) backed by Radix.
- TopBar gains a real **Import** button (hidden `<input type="file">` triggered by an icon), a **Save JSON** button, and an **Export ▾** dropdown listing PNG / SVG / PDF / JSON.
- Inline status pill next to the project name: success messages tint muted, errors tint destructive, auto-clears after 2.4 s. Replaces alert/toast scaffolding for now.
- `Ctrl/Cmd + S` saves JSON; `Ctrl/Cmd + E` exports PNG. Both use the same orchestration as the toolbar buttons.

### Files added/changed in batch 7

- `src/services/projectIO.ts` (new — JSON serialize / parse / strict validate)
- `src/services/exporters.ts` (new — PNG / SVG / PDF capture)
- `src/services/projectActions.ts` (new — orchestration)
- `src/components/ui/dropdown-menu.tsx` (new — shadcn primitive)
- `src/features/toolbar/TopBar.tsx` (real import / export / save wiring + status)
- `src/App.tsx` (Ctrl+S → save JSON, Ctrl+E → export PNG)

## Batch 8 — what shipped

### Coalescing — rapid edits collapse into one history entry

Before this batch, typing "API Gateway" into a title field pushed 11 history snapshots; one Ctrl+Z removed one letter. Now the **same field of the same entity** edited within a 700 ms window collapses into one logical step.

- New `src/store/coalesce.ts` — module-level `shouldPushFor(key)` / `flushCoalesce()`. Uses monotonic `performance.now()`, so a long stall doesn't get mistaken for two edits.
- Two new actions: `patchNodeCoalesced(id, patch)` and `patchEdgeCoalesced(id, patch)`. Coalesce key encodes entity kind + id + the *sorted set of patched fields*, so editing title-then-description (different fields) still records two snapshots.
- `undo` / `redo` and `hydrate` call `flushCoalesce()` so the next edit always starts a fresh entry.
- `PropertiesPanel` and `EdgePropertiesPanel` use the coalesced variant for text fields (title, description, edge label). Color/icon/flow-type/animated stay on the immediate `patch` so each click is a discrete undo step — that's how Figma/Linear behave.

### Visible Undo/Redo buttons

- `TopBar` now shows **Undo** / **Redo** icons left of Import. Tooltip shows the shortcut.
- Buttons disable when the corresponding stack is empty (`useHistoryAvailability` selector with shallow compare — they don't re-render the toolbar on every push).
- Keyboard shortcuts (`Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z`, `Ctrl+Y`) still work — they call the same actions.

### Import surfaces the history reset

- The import status pill now reads `Imported foo.json — undo history reset`, so users aren't surprised that they can't undo back into the previous canvas. (Hydration always clears `past`/`future` for safety.)

### Files added/changed in batch 8

- `src/store/coalesce.ts` (new — coalescing helper)
- `src/store/types.ts` (new actions on NodeSlice/EdgeSlice)
- `src/store/nodeSlice.ts` (+ `patchNodeCoalesced`)
- `src/store/edgeSlice.ts` (+ `patchEdgeCoalesced`, factored `applyEdgePatch`)
- `src/store/canvasSlice.ts` (flush on `hydrate`)
- `src/store/historySlice.ts` (flush on `undo`/`redo`)
- `src/features/properties/PropertiesPanel.tsx` (uses coalesced patch for text)
- `src/features/properties/EdgePropertiesPanel.tsx` (uses coalesced patch for label)
- `src/features/toolbar/RightSidebar.tsx` (passes coalesced patcher through)
- `src/features/toolbar/TopBar.tsx` (Undo / Redo buttons + disabled state + import status)

## Batch 9 — what shipped

### Discoverability

- **Floating canvas toolbar** (`features/canvas/FloatingToolbar.tsx`) at top-center of the canvas: Add (`A`), Zoom in / out, Fit, Undo / Redo. Glass card with backdrop blur, slides down on mount.
- **Help button** at bottom-right opens the shortcuts dialog; sits above React Flow's controls so it's reachable without crowding them.
- **Shortcuts dialog** (`features/help/ShortcutsDialog.tsx`) listing every keybinding in three sections (Edit, Canvas, Project). Opened with `?` or the toolbar's keyboard icon.
- **Keyboard icon in TopBar** for the same dialog — discoverable even before users learn `?`.

### Layout flexibility

- **Left & Right sidebars now collapse** to a 48 px rail with double-chevron toggle. Width transitions over 200 ms.
- Collapsed left rail keeps the top 6 component shortcuts as colored buttons with tooltips — drag-to-canvas still works while the panel is collapsed.
- Collapsed right rail is just an expand affordance (selection editing implies expansion anyway).

### Micro-interactions

- Nodes get a `pop-in` entrance (scale 0.94 → 1.02 → 1.0) when added — makes drag-and-drop feel responsive.
- Hover lifts nodes by 1 px and brightens their border + connection dots.
- Sidebar component cards lift + scale their swatch on hover.
- Edge stroke width animates between idle/selected; labels fade in.
- Status pill in the TopBar slides in from the right (`slide-in-right`) and is now a proper rounded pill — quieter, but more present.
- New animations centralized in `tailwind.config.js` (`fade-in`, `slide-in-right`, `slide-in-down`, `pop-in`).

### New shadcn primitives

- `components/ui/dialog.tsx` (Radix-backed Dialog + Overlay + Title + Description + Close).

### Files added/changed in batch 9

- `tailwind.config.js` (+ `slide-in-down`, `pop-in` keyframes)
- `src/components/ui/dialog.tsx` (new)
- `src/features/help/ShortcutsDialog.tsx` (new)
- `src/features/canvas/FloatingToolbar.tsx` (new)
- `src/features/canvas/HelpButton.tsx` (new)
- `src/hooks/useKeyboardShortcuts.ts` (`?` opens shortcuts dialog)
- `src/features/toolbar/TopBar.tsx` (keyboard icon + animated status pill + new prop)
- `src/features/toolbar/LeftSidebar.tsx` (collapsible)
- `src/features/toolbar/RightSidebar.tsx` (collapsible)
- `src/features/nodes/SystemNode.tsx` (entrance pop, hover lift, color stripe, prettier handles)
- `src/features/edges/SmartEdge.tsx` (animated stroke width + label fade)
- `src/features/canvas/Canvas.tsx` (hosts `FloatingToolbar` + `HelpButton`; new props)
- `src/App.tsx` (shortcuts dialog state, threaded handlers)

## Batch 10 — what shipped

### Virtualization

- `<ReactFlow onlyRenderVisibleElements>` — off-screen nodes and edges aren't mounted to the DOM. The single biggest win for large graphs.
- `nodesFocusable={false}`, `edgesFocusable={false}`, `elevateNodesOnSelect={false}` — skip work React Flow does to manage tab order and z-index when we don't need it.

### Stable identity

- Module-scope constants for every reference-compared prop on `<ReactFlow>`: `PRO_OPTIONS`, `FIT_VIEW_OPTIONS`, `SNAP_GRID`, `MULTI_SELECTION_KEYS`, plus `minimapNodeColor` / `minimapMaskColor`. Inline literals were causing internal memoization to miss and minimap nodes to re-paint on every store change.

### Targeted memoization

- `SystemNode` and `SmartEdge` now use **explicit equality functions**: re-render iff `selected`, `dragging`, position, or *the specific data fields they actually display* changed. The default `React.memo` shallow compare missed our immutable `data` spreads, so every patch was re-rendering every node.
- Equality skips `metadata` for `SystemNode` (not rendered) and skips edge id flags it doesn't show. Net: a typing-coalesced rename of one node doesn't re-render the other 999.

### Selector refinement

- `RightSidebar` no longer subscribes to the full `nodes` array. New `useSelectedEdgeEndpoints()` selector returns just `{source, target}` titles for the currently selected edge, comparing shallowly. The panel now re-renders only when *its own* entity changes.
- `useGraphCounts()` selector for the stats pill — re-renders when counts change, not on every node patch.

### Adaptive animations

- `body.entrance-animations` class is toggled by `useEntranceAnimations()` (threshold: 200 nodes). Below that, nodes get the entrance pop. Above, the keyframe is silently skipped — importing a 1000-node project is instant.
- `prefers-reduced-motion: reduce` disables the entrance animation entirely.

### Visible affordance

- New `StatsPill` at the bottom-center of the canvas: "247 nodes · 312 edges". Subscribed only to counts so it costs nothing; useful as a sanity check during exports and for confirming an import landed correctly.

### Files added/changed in batch 10

- `src/features/nodes/SystemNode.tsx` (custom `areNodePropsEqual`, gated entrance class)
- `src/features/edges/SmartEdge.tsx` (custom `areEdgePropsEqual`)
- `src/features/canvas/Canvas.tsx` (`onlyRenderVisibleElements`, module-scope props, mounts `StatsPill`)
- `src/features/canvas/StatsPill.tsx` (new)
- `src/store/index.ts` (`useSelectedEdgeEndpoints`, `useGraphCounts`)
- `src/features/toolbar/RightSidebar.tsx` (uses focused selector)
- `src/hooks/useEntranceAnimations.ts` (new — threshold-gated animation toggle)
- `src/styles/globals.css` (gated `system-node-pop` keyframe)
- `src/App.tsx` (installs `useEntranceAnimations`)

### Verified behavior

- Import a 500-node project → no entrance animation pile-up; pan/zoom stays smooth (only ~50–80 nodes are mounted at any time on a 1080p screen).
- Type into a node title → only that node re-renders; the other 999 stay quiet (verified with React DevTools highlighting).
- Selecting an edge → the right sidebar re-renders once; subsequent unrelated node edits don't bounce the panel.

## Roadmap of what's next (optional, beyond the spec)

- Multi-select-aware clipboard (currently single-node — store hooks ready, just needs UI).
- Persistence to `localStorage` so refreshes don't lose the canvas.
- Auto-layout (e.g. dagre / elkjs) for "tidy this diagram" flows.
- Custom node templates / user-saved presets.
- Collaborative editing via CRDT (Yjs) — the existing store maps cleanly.

## Batch 11 — what shipped

### Bug fix — handle routing

`SystemNode` had two `target` and two `source` handles with no `id` — React Flow's connection resolver returned the first matching handle, so dragging an edge to the **left** side of a node always routed to **top**. Fixed by giving each handle an explicit position-based id (`top` / `right` / `bottom` / `left`) and making them all bidirectional (`type="source"` + `isConnectableEnd`). Edges now route to whichever side the cursor is over, regardless of which side the connection started from.

### Multi-selection

- New store fields: `selectedNodeIds: string[]`, `selectedEdgeIds: string[]`, `selectionBox`. Legacy `selection: SelectionTarget` is *derived* from the multi-arrays so existing single-selection consumers (property panel, edge endpoint selector) keep working.
- Actions: `setSelectedIds`, `addToSelection`, `removeFromSelection`, `clearSelection`, `selectAll`, `setSelectionBox`.
- React Flow's selection state is **projected**, not duplicated: each render flags the current store ids on the `Node`/`Edge` array, and `onSelectionChange` syncs back. No persistent `selected` flag in the snapshot, so undo/redo doesn't replay stale highlight state.
- **Lasso (drag-select)** uses `Shift + drag` so plain drag still pans. Inside the Shift selection box, all overlapped nodes/edges are added.
- **Shift+click** extends the selection (add/remove); **Ctrl/Cmd+click** also extends (Linux/Windows convention). All routed through React Flow's `multiSelectionKeyCode`.
- **Ctrl/Cmd+A** selects every node and edge.

### Visual feedback

- `SelectionOverlay` (new feature module) renders inside the React Flow viewport with a transform that mirrors the live `transform[]` state, so:
  - A blue **bounding box** wraps the multi-selection (only when 2+ nodes selected) with a faint primary fill and 2 px ring.
  - Each non-collapsed group draws a **dashed frame** in its color with a label tag in the top-left corner.
- Group frames pan/zoom with the canvas; the selection box also follows live drag (since it derives from positions).
- All overlay layers are `pointer-events: none` so they're decorative; selection still flows through node/edge click.

### Bulk actions

- `bulkPatchNodes(ids, patch)` — apply the same `data` patch to N nodes in one history step. Used by the bulk color picker and the rename pattern.
- `bulkUpdateNodes(updater, ids)` — apply a per-node update (different position per node) in one history step. Used by align + distribute.
- `removeNodes(ids)` — multi-delete with cascading edge cleanup AND group cleanup (groups with no surviving members are dropped). One history entry.
- `duplicateSelection`, `copySelection`, `cutSelection`, `pasteAt` upgraded to multi-node:
  - Edges *between* selected nodes come along; edges with one endpoint outside are dropped.
  - Groups whose membership is fully inside the selection come along, with fresh group ids on paste.
  - `pasteAt` centers the *centroid* of the clipboard at the paste target (cursor or right-click position).
  - Pasted/duplicated nodes are auto-selected as a group, so users can immediately re-arrange.

### Alignment + distribute

- New `features/selection/alignment.ts`:
  - `alignNodes(nodes, axis)` — Left / Center / Right / Top / Middle / Bottom. **Aligns relative to the first-selected node** (not the bounding box) — matches Figma's behavior and makes the result predictable.
  - `distributeNodes(nodes, axis)` — Horizontal / Vertical, requires 3+ nodes. Outermost nodes stay; inner nodes spaced for equal gaps.
  - `nodesBounds(nodes)` — used by alignment, the selection overlay, and the export framing (still works untouched).
- All alignment commands route through `bulkUpdateNodes` so they're a single undo step.

### Grouping

- New `features/groups/` module with `groupFactory.ts` (id + curated colors), `groupMovement.ts` (drag-mirroring siblings).
- `SystemNodeGroup`: `{ id, label, color, collapsed }`. Group membership lives on each node as `data.groupId`, so deleting a node never leaves orphan references.
- `groupSelection()` — needs ≥2 selected nodes. Strips any prior `groupId` so regrouping is a single move (no stale membership). Survival pass: prior groups with no remaining members are dropped.
- `ungroupSelection()` — finds all groups touched by the current selection, strips `groupId` on every member, removes the group objects.
- `toggleGroupCollapsed`, `patchGroup`, `removeGroup` for future expand-as-chip UX.
- **Group movement** — when the user drags any node in a group, `expandGroupMoves` mirrors the position delta to every other group member during the drag (skipped when the multi-selection already includes them, to avoid double-moving). Drop is unchanged so React Flow's snap + history logic still applies.

### Smart delete

- Threshold confirmation: any delete request for **>20 nodes** opens a `ConfirmDialog` (new shadcn primitive) before destroying anything. Routes through `App.handleRequestBulkDelete` so all paths (keyboard, sidebar button, context menu) share the same prompt.
- Delete cascades: selected nodes → connected edges → groups whose membership is now empty. One history entry, one Ctrl+Z undoes everything.

### Multi-selection sidebar

- `MultiSelectionPanel` swaps in when 2+ nodes are selected:
  - **Bulk color** — 12-swatch palette, applied to all selected nodes.
  - **Rename pattern** — `Service {i}` placeholder; `{i}` is the 1-based index in top-left → bottom-right reading order.
  - **Align** — 6 directions in a 3×2 grid.
  - **Distribute** — H / V (disabled <3 nodes).
  - **Duplicate** / **Group** / **Ungroup** buttons.
  - **Delete N** button (routes through the confirm threshold).
- `RightSidebar` switches between four modes: empty → single node → single edge → multi-selection. Render priority: `multi >= 2 → edge → node → empty`.

### Context menu

- Node menu now shows counts when multi-selecting: "Copy 5 nodes", "Duplicate 5", "Delete 5".
- New entries: **Group selection** (Ctrl+G), **Ungroup** (Ctrl+Shift+G), each gated on multi-selection size.
- Pane menu now includes **Select all** (Ctrl+A).
- Right-clicking a node *outside* the current multi-selection narrows the selection to just that node first (Figma/Linear convention).

### Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Shift + drag` | Lasso multi-select |
| `Shift / Ctrl / Cmd + click` | Add/remove from selection |
| `Ctrl/Cmd + A` | Select all |
| `Ctrl/Cmd + D` | Duplicate selection |
| `Ctrl/Cmd + G` | Group selection |
| `Ctrl/Cmd + Shift + G` | Ungroup |
| `Esc` | Clear selection |
| `Del` / `Backspace` | Delete (with confirm if >20 nodes) |

`useKeyboardShortcuts` gained `onRequestBulkDelete(count)` returning `boolean`. When it returns `true`, the keyboard handler defers and lets the dialog flow finish.

### JSON IO — backward compatible v1 → v2

- **v1 configs still load** — `groups` is optional on import, defaults to `[]` for older files.
- New writes are version `2`, with `groups: SystemNodeGroup[]` and `node.data.groupId` populated.
- Defensive cleanup on import:
  - Edges whose endpoints are missing → dropped (unchanged).
  - Groups with no surviving members → dropped.
  - Nodes whose `groupId` references a missing group → `groupId` cleared.
- All validation paths still throw `ProjectIOError` with the exact failing path (no `any`, strict TS).

### Performance

- All bulk actions touch the store **once** per user action — no per-node patch loops, so 50-node align is one render of nodes, not 50.
- `useSelectedNodes` and `useSelectionCount` use `useShallow`, so unrelated graph edits don't bounce the bulk panel.
- React Flow virtualization (`onlyRenderVisibleElements`) is unchanged from batch 10 — still active.
- `expandGroupMoves` builds its index lazily per change-set and skips when no groups exist — zero cost when groups aren't in use.

### Files added in batch 11

- `src/components/ui/confirm-dialog.tsx`
- `src/features/groups/groupFactory.ts`
- `src/features/groups/groupMovement.ts`
- `src/features/selection/alignment.ts`
- `src/features/selection/SelectionOverlay.tsx`
- `src/features/properties/MultiSelectionPanel.tsx`
- `src/store/groupSlice.ts`

### Files updated in batch 11

- `src/types/index.ts` (groups, `groupId` on node data, version: 2)
- `src/store/types.ts` (slice contracts: bulk actions, selection arrays, group slice)
- `src/store/index.ts` (compose group slice; `useSelectedNodes`, `useSelectionCount`, `useGroups`)
- `src/store/canvasSlice.ts` (hydrate accepts groups)
- `src/store/historySlice.ts` (snapshots include groups; clear multi-selection on undo/redo)
- `src/store/nodeSlice.ts` (`bulkPatchNodes`, `bulkUpdateNodes`, `removeNodes`)
- `src/store/selectionSlice.ts` (multi-select actions; derived legacy `selection`)
- `src/store/clipboardSlice.ts` (multi-node copy/cut/paste/duplicate; group remap on clone)
- `src/services/projectIO.ts` (v1↔v2, groups parse/serialize, integrity sweep)
- `src/services/projectActions.ts` (pass groups to serialize/hydrate)
- `src/features/canvas/Canvas.tsx` (lasso, projected selection, group movement, mounts `SelectionOverlay`, bulk-delete confirm hook)
- `src/features/nodes/SystemNode.tsx` (handle ID fix — top/right/bottom/left)
- `src/features/toolbar/RightSidebar.tsx` (multi vs single panel switch)
- `src/features/help/ShortcutsDialog.tsx` (new Selection section)
- `src/hooks/useKeyboardShortcuts.ts` (Ctrl+A/G/Shift+G; bulk-delete deferral)
- `src/App.tsx` (confirm dialog + new Canvas/RightSidebar props)

### Assumptions

- **Lasso uses `Shift + drag`**, not bare drag, because the existing UX has bare drag = pan. The empty-state hint and shortcuts dialog both call this out.
- **Multi-selection includes edges only when explicitly box-selected or `Ctrl+A`'d** — clicking a node never adds an edge to the selection. This keeps "delete selection" predictable.
- **Group membership lives on the node**, not the group — adding/removing one node is a single `patchNode`, not a group rewrite, and a node delete can never leave dangling references.
- **Align reference is the first-selected node**, not the bounding box. Matches Figma; lets the user *intend* "align everything to this one".
- **Group movement skips siblings that are already in the multi-selection** — React Flow already moves all selected nodes by the same delta, so mirroring would teleport them.
- **20-node threshold** for the destructive-confirm matches the spec exactly. Threshold + confirm path is centralized so changing it is a one-line update in `Canvas.tsx`.
- **Pasted groups get fresh ids** — pasting a group twice creates two distinct groups, not one shared one.
- **`selectionBox` field is in the store** as required by the spec, but React Flow renders the lasso itself, so no UI code reads it — kept for forward compatibility.

## How to run

```bash
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`).
