import { useLayoutEffect, useMemo } from "react";
import { type CatalogItem } from "../../components/Catalog/Catalog.native";
import { useDevToolsShell } from "../../context";
import { filterTools, toolsForCategory } from "../../utils/toolsUtils";
import type { ToolsScreenProps } from "../navigation.native";

export interface ToolsScreenViewProps {
  items: CatalogItem[];
  query: string;
  onQueryChange: (query: string) => void;
}

export function useToolsScreenViewModel({
  navigation,
  route,
}: ToolsScreenProps): ToolsScreenViewProps {
  const { category } = route.params;
  const { categories, query, setQuery } = useDevToolsShell();

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
        description: tool.owner,
        onPress: () => navigation.push("tool", { toolId: tool.id }),
      })),
    [tools, navigation],
  );

  return { items, query, onQueryChange: setQuery };
}
