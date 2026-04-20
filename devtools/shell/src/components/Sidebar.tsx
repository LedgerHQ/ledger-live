import { SearchInput } from "@ledgerhq/lumen-ui-react";
import {
  Settings,
  Experiment2,
  Bluetooth,
  DocumentCode,
  Bug,
  Information,
  SpeedFast,
  Planet,
} from "@ledgerhq/lumen-ui-react/symbols";
import { useMemo, useState } from "react";
import { Category } from "../types";
import type { Tool } from "../types";
import { useAccordion } from "../hooks";
import { CategoryRow } from "./CategoryRow";

const CATEGORY_ICONS = {
  [Category.CONFIGURATION]: Settings,
  [Category.FEATURES_AND_FLOWS]: Experiment2,
  [Category.CONNECTIVITY]: Bluetooth,
  [Category.GENERATORS]: DocumentCode,
  [Category.DEBUGGING]: Bug,
  [Category.INFORMATION]: Information,
  [Category.PERFORMANCE]: SpeedFast,
  [Category.PLAYGROUND]: Planet,
};

interface SidebarProps {
  categories: Array<{ category: Category; tools: Tool[] }>;
  activeToolId: string | undefined;
  onSelectTool: (id: string) => void;
}

export function Sidebar({ categories, activeToolId, onSelectTool }: SidebarProps) {
  const { isExpanded, toggle } = useAccordion<Category>({ mode: "single" });
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();

  const filteredCategories = useMemo(
    () =>
      categories
        .map(({ category, tools }) => ({
          category,
          tools: q
            ? tools.filter(
                t =>
                  t.label.toLowerCase().includes(q) ||
                  t.category.toLowerCase().includes(q) ||
                  (t.owner ?? "").toLowerCase().includes(q),
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
            isExpanded={isExpanded(category)}
            onToggle={() => toggle(category)}
            activeToolId={activeToolId}
            onSelectTool={onSelectTool}
          />
        ))}
      </ul>
    </nav>
  );
}
