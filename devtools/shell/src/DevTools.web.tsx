import { ThemeProvider, Divider } from "@ledgerhq/lumen-ui-react";
import { ledgerLiveThemes } from "@ledgerhq/lumen-design-core";
import { TOOLS } from "./tools.config";
import { useDevToolsNavigation } from "./hooks";
import { useDevToolsStorage } from "./hooks/useDevToolsStorage.web";
import { Sidebar, ToolShell, EmptyState } from "./components";

type ColorScheme = "light" | "dark" | "system";

interface DevToolsProps {
  colorScheme?: ColorScheme;
}

export const DevTools = ({ colorScheme = "system" }: DevToolsProps) => {
  const { activeTool, setActiveToolId, categories } = useDevToolsNavigation(TOOLS);

  useDevToolsStorage(activeTool?.id, setActiveToolId);

  return (
    <ThemeProvider themes={ledgerLiveThemes} colorScheme={colorScheme}>
      <div data-testid="devtools" className="flex flex-col h-full bg-canvas text-base">
        <div className="flex items-center gap-8 px-16 py-6 bg-warning text-warning body-3 font-semibold border-b border-muted shrink-0">
          <span className="w-6 h-6 rounded-full bg-warning-strong shrink-0" />
          Internal tools. Changes here affect only this install.
        </div>

        <div className="flex flex-1 min-h-0">
          <Sidebar
            categories={categories}
            activeToolId={activeTool?.id}
            onSelectTool={setActiveToolId}
          />

          <Divider orientation="vertical" />

          <main
            data-testid="devtools-content"
            className="flex flex-col flex-1 min-w-0 overflow-auto bg-canvas"
          >
            {activeTool ? (
              <ToolShell tool={activeTool} />
            ) : (
              <EmptyState
                categories={categories}
                onSelect={setActiveToolId}
                data-testid="devtools-empty"
              />
            )}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
};
