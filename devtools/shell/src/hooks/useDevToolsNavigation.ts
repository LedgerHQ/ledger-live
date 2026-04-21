import { useMemo, useState } from "react";
import { Category } from "../types";
import type { Tool } from "../types";

export const useDevToolsNavigation = (tools: Tool[]) => {
  const [activeToolId, setActiveToolId] = useState<string | null>(null);

  const categories = useMemo(
    () =>
      Object.values(Category).map(category => ({
        category,
        tools: tools.filter(t => t.category === category),
      })),
    [tools],
  );

  const activeTool = useMemo(
    () => tools.find(t => t.id === activeToolId) ?? null,
    [tools, activeToolId],
  );

  return { activeToolId, setActiveToolId, activeTool, categories };
};
