import { useMemo } from "react";
import { useDevToolsNavigation } from "../hooks";
import { useDevToolsStorage } from "../hooks/useDevToolsStorage.web";
import type { Category, Tool, ToolId } from "@devtools/core";
import { filterToolsByPlatform } from "../utils/toolsUtils";

type ColorScheme = "light" | "dark" | "system";

interface DevToolsInput {
  tools: Tool[];
  colorScheme?: ColorScheme;
}

export interface DevToolsViewProps {
  colorScheme: ColorScheme;
  categories: Array<{ category: Category; tools: Tool[] }>;
  activeTool: Tool | null;
  recentToolIds: ToolId[];
  onSelectTool: (id: ToolId) => void;
  onClearTool: () => void;
}

export function useDevToolsViewModel({
  tools,
  colorScheme = "system",
}: DevToolsInput): DevToolsViewProps {
  const webTools = useMemo(() => filterToolsByPlatform(tools, "web"), [tools]);
  const { activeTool, setActiveToolId, clearActiveTool, categories } =
    useDevToolsNavigation(webTools);
  const { recentToolIds } = useDevToolsStorage(activeTool?.id, setActiveToolId);

  return {
    colorScheme,
    categories,
    activeTool,
    recentToolIds,
    onSelectTool: setActiveToolId,
    onClearTool: clearActiveTool,
  };
}
