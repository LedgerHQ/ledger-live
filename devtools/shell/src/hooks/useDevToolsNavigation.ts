import { useMemo, useState } from "react";
import { Category } from "../types";
import type { Tool } from "../types";

export const useDevToolsNavigation = (tools: Tool[]) => {
  const [activeTool, setActiveTool] = useState<Tool | null>(null);

  const categories = useMemo(
    () =>
      Object.values(Category).map(category => ({
        category,
        tools: tools.filter(t => t.category === category),
      })),
    [tools],
  );

  return { activeTool, setActiveTool, categories };
};
