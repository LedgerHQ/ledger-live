import { ThemeProvider, Divider } from "@ledgerhq/lumen-ui-react";
import { Sidebar, ToolShell, Overview } from "../components";
import { useDevToolsViewModel, type DevToolsViewProps } from "./useDevToolsViewModel.web";

type ColorScheme = "light" | "dark" | "system";

function DevToolsView({
  colorScheme,
  categories,
  activeTool,
  recentToolIds,
  onSelectTool,
  onClearTool,
}: DevToolsViewProps) {
  return (
    <ThemeProvider colorScheme={colorScheme}>
      <div data-testid="devtools" className="flex flex-col h-full bg-canvas text-base">
        <div className="flex items-center gap-8 px-16 py-6 bg-warning text-warning body-3 font-semibold border-b border-muted shrink-0">
          <span className="w-6 h-6 rounded-full bg-warning-strong shrink-0" />
          Internal tools. Changes here affect only this install.
        </div>

        <div className="flex flex-1 min-h-0">
          <Sidebar
            categories={categories}
            activeToolId={activeTool?.id}
            onSelectTool={onSelectTool}
            onHome={onClearTool}
          />

          <Divider orientation="vertical" />

          <main
            data-testid="devtools-content"
            className="flex flex-col flex-1 min-w-0 overflow-auto bg-canvas"
          >
            {activeTool ? (
              <ToolShell tool={activeTool} onBack={onClearTool} />
            ) : (
              <Overview
                categories={categories}
                recentToolIds={recentToolIds}
                onSelect={onSelectTool}
                data-testid="devtools-empty"
              />
            )}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}

interface DevToolsProps {
  colorScheme?: ColorScheme;
}

export const DevTools = ({ colorScheme }: DevToolsProps) => (
  <DevToolsView {...useDevToolsViewModel({ colorScheme })} />
);
