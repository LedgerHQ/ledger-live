import { useLayoutEffect, useMemo } from "react";
import { useDevToolsShell } from "../../context";
import type { Tool } from "@devtools/registry";
import type { ToolScreenProps } from "../navigation.native";

export interface ToolScreenViewProps {
  tool: Tool | null;
}

export function useToolScreenViewModel({
  navigation,
  route,
}: ToolScreenProps): ToolScreenViewProps {
  const { toolId } = route.params;
  const { categories } = useDevToolsShell();

  const tool = useMemo(
    () => categories.flatMap(c => c.tools).find(t => t.id === toolId) ?? null,
    [categories, toolId],
  );

  useLayoutEffect(() => {
    if (tool) navigation.setOptions({ title: tool.label });
  }, [navigation, tool]);

  return { tool };
}
