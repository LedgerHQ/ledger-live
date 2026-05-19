import { tools } from "../registry/tools";
import { useDevToolsNavigation } from "../hooks";
import { useDevToolsStorage } from "../hooks/useDevToolsStorage.web";
import type { Category, Tool } from "@devtools/core";
import { filterToolsByPlatform } from "../utils/toolsUtils";

type ColorScheme = "light" | "dark" | "system";

interface DevToolsInput {
  colorScheme?: ColorScheme;
}

export interface DevToolsViewProps {
  colorScheme: ColorScheme;
  categories: Array<{ category: Category; tools: Tool[] }>;
  activeTool: Tool | null;
  recentToolIds: string[];
  onSelectTool: (id: string) => void;
  onClearTool: () => void;
}

export function useDevToolsViewModel({
  colorScheme = "system",
}: DevToolsInput = {}): DevToolsViewProps {
  const { activeTool, setActiveToolId, clearActiveTool, categories } = useDevToolsNavigation(
    filterToolsByPlatform(tools, "web"),
  );
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
