import { useToolsFromConfig, useDevToolsStorage } from "../hooks";
import type { Category, DevToolsConfig, Tool, ToolId } from "@devtools/registry";
import type { ReactNode } from "react";

interface DevToolsInput {
  config: DevToolsConfig;
  footer?: ReactNode;
}

export interface DevToolsViewProps {
  categories: Array<{ category: Category; tools: Tool[] }>;
  activeTool: Tool | null;
  recentToolIds: ToolId[];
  onSelectTool: (id: ToolId) => void;
  onClearTool: () => void;
  footer?: ReactNode;
}

export function useDevToolsViewModel({ config, footer }: DevToolsInput): DevToolsViewProps {
  const { activeTool, setActiveToolId, clearActiveTool, categories } = useToolsFromConfig(
    config,
    "web",
  );
  const { recentToolIds } = useDevToolsStorage(activeTool?.id, setActiveToolId);

  return {
    categories,
    activeTool,
    recentToolIds,
    onSelectTool: setActiveToolId,
    onClearTool: clearActiveTool,
    footer,
  };
}
