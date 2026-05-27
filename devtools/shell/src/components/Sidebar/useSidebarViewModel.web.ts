import { useMemo, useState } from "react";
import type { ChangeEventHandler } from "react";
import type { Category, Tool, ToolId } from "@devtools/registry";
import { useAccordion } from "../../hooks";
import type { IconComponent } from "../../categoryConfig";
import { CATEGORY_ICONS } from "../../categoryConfig";
import { filterToolsByQuery, findCategoryForToolId } from "../../utils/toolsUtils";

interface SidebarInput {
  categories: Array<{ category: Category; tools: Tool[] }>;
  activeToolId: ToolId | undefined;
  onSelectTool: (id: ToolId) => void;
  onHome: () => void;
}

export interface SidebarViewProps {
  query: string;
  onQueryChange: ChangeEventHandler<HTMLInputElement>;
  filteredCategories: Array<{ category: Category; tools: Tool[] }>;
  isSearchActive: boolean;
  isExpanded: (category: Category) => boolean;
  onToggle: (category: Category) => void;
  getCategoryIcon: (category: Category) => IconComponent;
  activeToolId: ToolId | undefined;
  onSelectTool: (id: ToolId) => void;
  onHome: () => void;
}

export function useSidebarViewModel({
  categories,
  activeToolId,
  onSelectTool,
  onHome,
}: SidebarInput): SidebarViewProps {
  const [query, setQuery] = useState("");

  const activeCategory = useMemo(
    () => findCategoryForToolId(categories, activeToolId),
    [activeToolId, categories],
  );

  const { isExpanded, toggle } = useAccordion<Category>({
    mode: "single",
    openKey: activeCategory,
  });

  const isSearchActive = query.trim().length > 0;
  const filteredCategories = useMemo(
    () => filterToolsByQuery(categories, query),
    [categories, query],
  );

  return {
    query,
    onQueryChange: e => setQuery(e.target.value),
    filteredCategories,
    isSearchActive,
    isExpanded,
    onToggle: toggle,
    getCategoryIcon: category => CATEGORY_ICONS[category],
    activeToolId,
    onSelectTool,
    onHome,
  };
}
