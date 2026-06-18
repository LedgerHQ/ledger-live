import { Suspense } from "react";
import { Divider } from "@ledgerhq/lumen-ui-react";
import { Sidebar, ToolShell, Overview } from "../components";
import { Loading } from "../components/Loading/Loading.web";
import { useDevToolsViewModel, type DevToolsViewProps } from "./useDevToolsViewModel.web";
import { DevToolsProvider } from "../context";
import { type DevToolsConfig } from "@devtools/registry";

export interface DevToolsProps {
  config?: DevToolsConfig;
}

function DevToolsView({
  categories,
  activeTool,
  recentToolIds,
  onSelectTool,
  onClearTool,
}: DevToolsViewProps) {
  return (
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
            <Suspense fallback={<Loading />}>
              <ToolShell tool={activeTool} onBack={onClearTool} />
            </Suspense>
          ) : (
            <Overview
              categories={categories}
              recentToolIds={recentToolIds}
              onSelect={onSelectTool}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export const DevTools = ({ config = [] }: DevToolsProps) => {
  return (
    <DevToolsProvider value={config}>
      <DevToolsView {...useDevToolsViewModel({ config })} />
    </DevToolsProvider>
  );
};
