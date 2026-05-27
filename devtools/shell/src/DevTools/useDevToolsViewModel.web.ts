import { useMemo } from "react";
import { useDevToolsNavigation } from "../hooks";
import { useDevToolsStorage } from "../hooks/useDevToolsStorage.web";
import type { Category, Tool, ToolId } from "@devtools/registry";
import { filterToolsByPlatform } from "../utils/toolsUtils";

interface DevToolsInput {
  tools: Tool[];
}

export interface DevToolsViewProps {
  categories: Array<{ category: Category; tools: Tool[] }>;
  activeTool: Tool | null;
  recentToolIds: ToolId[];
  onSelectTool: (id: ToolId) => void;
  onClearTool: () => void;
}

export function useDevToolsViewModel({ tools }: DevToolsInput): DevToolsViewProps {
  const webTools = useMemo(() => filterToolsByPlatform(tools, "web"), [tools]);
  const { activeTool, setActiveToolId, clearActiveTool, categories } =
    useDevToolsNavigation(webTools);
  const { recentToolIds } = useDevToolsStorage(activeTool?.id, setActiveToolId);

  return {
    categories,
    activeTool,
    recentToolIds,
    onSelectTool: setActiveToolId,
    onClearTool: clearActiveTool,
  };
}
