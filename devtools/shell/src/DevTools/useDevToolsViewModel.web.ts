import { TOOLS } from "../tools.config";
import { useDevToolsNavigation } from "../hooks";
import { useDevToolsStorage } from "../hooks/useDevToolsStorage.web";
import type { Category, Tool } from "../types";

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
  const { activeTool, setActiveToolId, clearActiveTool, categories } = useDevToolsNavigation(TOOLS);
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
