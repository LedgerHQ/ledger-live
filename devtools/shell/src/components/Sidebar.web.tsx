import { SearchInput } from "@ledgerhq/lumen-ui-react";
import { useEffect, useMemo, useState } from "react";
import { Category } from "../types";
import type { Tool } from "../types";
import { useAccordion } from "../hooks";
import { CATEGORY_ICONS } from "../categoryConfig";
import { CategoryRow } from "./CategoryRow";
import { IconSquare } from "./IconSquare";

interface SidebarProps {
  categories: Array<{ category: Category; tools: Tool[] }>;
  activeToolId: string | undefined;
  onSelectTool: (id: string) => void;
  onHome: () => void;
}

export function Sidebar({ categories, activeToolId, onSelectTool, onHome }: SidebarProps) {
  const { isExpanded, toggle, expand } = useAccordion<Category>({ mode: "single" });
  const [query, setQuery] = useState("");

  const activeCategory = useMemo(
    () =>
      activeToolId
        ? categories.find(({ tools }) => tools.some(t => t.id === activeToolId))?.category ?? null
        : null,
    [activeToolId, categories],
  );

  // Tools can be activated from the Overview without going through the accordion, keep it in sync.
  useEffect(() => {
    if (activeCategory) expand(activeCategory);
  }, [activeCategory, expand]);

  const q = query.trim().toLowerCase();
  const isSearchActive = q.length > 0;

  const filteredCategories = useMemo(
    () =>
      categories
        .map(({ category, tools }) => ({
          category,
          tools: q
            ? tools.filter(
                t => t.label.toLowerCase().includes(q) || (t.owner ?? "").toLowerCase().includes(q),
              )
            : tools,
        }))
        .filter(({ tools }) => tools.length > 0),
    [categories, q],
  );

  return (
    <nav
      data-testid="devtools-nav"
      className="w-[240px] shrink-0 bg-surface border-r border-muted flex flex-col"
    >
      <button
        onClick={onHome}
        className="flex items-center gap-12 px-16 pt-16 w-full text-left bg-transparent border-none cursor-pointer hover:opacity-80"
      >
        <IconSquare category={Category.CONFIGURATION} variant="inverted" />
        <span className="body-1 font-semibold">DevTools</span>
      </button>

      <div className="p-12">
        <SearchInput
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search tools"
          data-testid="devtools-search"
        />
      </div>

      <ul className="flex flex-col flex-1 list-none px-8 pb-12 gap-4 overflow-y-auto">
        {filteredCategories.length === 0 && (
          <li className="px-12 py-8 body-3 text-muted">No tools match &ldquo;{query}&rdquo;.</li>
        )}
        {filteredCategories.map(({ category, tools }) => (
          <CategoryRow
            key={category}
            category={category}
            tools={tools}
            icon={CATEGORY_ICONS[category]}
            isExpanded={isSearchActive || isExpanded(category)}
            onToggle={() => toggle(category)}
            activeToolId={activeToolId}
            onSelectTool={onSelectTool}
          />
        ))}
      </ul>
    </nav>
  );
}
