import { Suspense } from "react";
import type { ReactNode } from "react";
import { ThemeProvider, Divider } from "@ledgerhq/lumen-ui-react";
import { Sidebar, ToolShell, Overview } from "../components";
import { Loading } from "../components/Loading/Loading.web";
import { useDevToolsViewModel, type DevToolsViewProps } from "./useDevToolsViewModel.web";
import { DevToolsProvider } from "../context";
import type { DevToolsPropsRegistry, ToolLoaders } from "@devtools/core";
import { useResolvedTools } from "../registry/useResolvedTools";

type ColorScheme = "light" | "dark" | "system";

export interface DevToolsProps {
  toolLoaders: ToolLoaders;
  toolProps?: Partial<DevToolsPropsRegistry>;
  colorScheme?: ColorScheme;
  fallback?: ReactNode;
}

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

function DevToolsInner({
  toolLoaders,
  colorScheme,
}: {
  toolLoaders: ToolLoaders;
  colorScheme?: ColorScheme;
}) {
  const { tools } = useResolvedTools(toolLoaders);
  return <DevToolsView {...useDevToolsViewModel({ tools, colorScheme })} />;
}

export const DevTools = ({ toolLoaders, colorScheme, toolProps, fallback }: DevToolsProps) => (
  <Suspense fallback={fallback ?? <Loading />}>
    <DevToolsProvider value={toolProps}>
      <DevToolsInner toolLoaders={toolLoaders} colorScheme={colorScheme} />
    </DevToolsProvider>
  </Suspense>
);
