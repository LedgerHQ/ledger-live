import { SearchInput } from "@ledgerhq/lumen-ui-react";
import { ArrowLeft } from "@ledgerhq/lumen-ui-react/symbols";
import { Category, ValueOf } from "@devtools/registry";
import type { Tool, ToolId } from "@devtools/registry";
import type { ReactNode } from "react";
import { CategoryRow } from "../CategoryRow/CategoryRow";
import { IconSquare } from "../IconSquare/IconSquare";
import { useSidebarViewModel, type SidebarViewProps } from "./useSidebarViewModel";

function SidebarView({
  query,
  onQueryChange,
  filteredCategories,
  isSearchActive,
  isExpanded,
  onToggle,
  getCategoryIcon,
  activeToolId,
  onSelectTool,
  onHome,
  onClose,
  footer,
}: SidebarViewProps) {
  return (
    <nav
      data-testid="devtools-nav"
      className="w-[240px] shrink-0 bg-surface border-r border-muted flex flex-col"
    >
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Back"
          className="flex items-center px-16 pt-16 text-muted bg-transparent border-none cursor-pointer hover:text-base"
        >
          <ArrowLeft size={20} />
        </button>
      )}
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
          onChange={onQueryChange}
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
            icon={getCategoryIcon(category)}
            isExpanded={isSearchActive || isExpanded(category)}
            onToggle={() => onToggle(category)}
            activeToolId={activeToolId}
            onSelectTool={onSelectTool}
          />
        ))}
      </ul>
      {footer}
    </nav>
  );
}

interface SidebarProps {
  categories: Array<{ category: ValueOf<typeof Category>; tools: Tool[] }>;
  activeToolId: ToolId | undefined;
  onSelectTool: (id: ToolId) => void;
  onHome: () => void;
  onClose?: () => void;
  footer?: ReactNode;
}

export function Sidebar(props: SidebarProps) {
  return <SidebarView {...useSidebarViewModel(props)} />;
}
