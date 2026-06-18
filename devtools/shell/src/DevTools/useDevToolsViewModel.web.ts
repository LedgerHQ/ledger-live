import { useToolsFromConfig } from "../hooks";
import { useDevToolsStorage } from "../hooks/useDevToolsStorage.web";
import type { Category, DevToolsConfig, Tool, ToolId } from "@devtools/registry";

interface DevToolsInput {
  config: DevToolsConfig;
}

export interface DevToolsViewProps {
  categories: Array<{ category: Category; tools: Tool[] }>;
  activeTool: Tool | null;
  recentToolIds: ToolId[];
  onSelectTool: (id: ToolId) => void;
  onClearTool: () => void;
}

export function useDevToolsViewModel({ config }: DevToolsInput): DevToolsViewProps {
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
  };
}
