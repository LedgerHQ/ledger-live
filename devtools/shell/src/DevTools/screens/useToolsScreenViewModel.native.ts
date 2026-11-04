import { useLayoutEffect, useMemo } from "react";
import { type CatalogItem } from "../../components";
import { toolIcon } from "../../toolConfig";
import { useDevToolsShell } from "../../context";
import { filterTools, toolsForCategory } from "../../utils";
import type { ToolsScreenProps } from "../navigation";

export interface ToolsScreenViewProps {
  items: CatalogItem[];
  query: string;
  onQueryChange: (query: string) => void;
  footer?: React.ReactNode;
}

export function useToolsScreenViewModel({
  navigation,
  route,
}: ToolsScreenProps): ToolsScreenViewProps {
  const { category } = route.params;
  const { categories, query, setQuery, footer } = useDevToolsShell();

  useLayoutEffect(() => {
    navigation.setOptions({ title: category });
  }, [navigation, category]);

  const tools = useMemo(
    () => filterTools(toolsForCategory(categories, category), query),
    [categories, category, query],
  );

  const items = useMemo<CatalogItem[]>(
    () =>
      tools.map(tool => ({
        key: tool.id,
        title: tool.label,
        logo: toolIcon(tool.id, category),
        kind: tool.kind,
        owner: tool.owner,
        onPress: () => navigation.push("tool", { toolId: tool.id }),
      })),
    [tools, navigation, category],
  );

  return { items, query, onQueryChange: setQuery, footer };
}
