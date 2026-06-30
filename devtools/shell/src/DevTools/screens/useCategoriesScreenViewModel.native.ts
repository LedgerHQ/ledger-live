import { useLayoutEffect, useMemo } from "react";
import { type CatalogItem } from "../../components/Catalog/Catalog.native";
import { CATEGORY_ICONS } from "../../categoryConfig.native";
import { useDevToolsShell } from "../../context";
import { filterToolsByQuery } from "../../utils/toolsUtils";
import type { CategoriesScreenProps } from "../navigation.native";

export interface CategoriesScreenViewProps {
  items: CatalogItem[];
  query: string;
  onQueryChange: (query: string) => void;
}

export function useCategoriesScreenViewModel({
  navigation,
}: CategoriesScreenProps): CategoriesScreenViewProps {
  const { categories, query, setQuery } = useDevToolsShell();

  useLayoutEffect(() => {
    navigation.setOptions({ title: "DevTools" });
  }, [navigation]);

  const filtered = useMemo(() => filterToolsByQuery(categories, query), [categories, query]);

  const items = useMemo<CatalogItem[]>(
    () =>
      filtered.map(({ category, tools }) => ({
        key: category,
        title: category,
        logo: CATEGORY_ICONS[category],
        count: tools.length,
        onPress: () => navigation.push("tools", { category }),
      })),
    [filtered, navigation],
  );

  return { items, query, onQueryChange: setQuery };
}
