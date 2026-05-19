import { ChevronRight } from "@ledgerhq/lumen-ui-react/symbols";
import { Category } from "../../types";
import type { Tool } from "../../types";
import { IconSquare } from "../IconSquare/IconSquare.web";

interface CategoryCardProps {
  category: Category;
  tools: Tool[];
  onSelect: (id: string) => void;
}

export function CategoryCard({ category, tools, onSelect }: CategoryCardProps) {
  const handleSelect = () => tools[0] && onSelect(tools[0].id);

  return (
    <button
      className="flex items-center gap-12 p-12 rounded-md bg-surface-hover hover:ring-1 hover:ring-muted text-left w-full border-none cursor-pointer"
      onClick={handleSelect}
    >
      <IconSquare category={category} />
      <div className="flex-1 min-w-0">
        <div className="body-2 font-semibold truncate">{category}</div>
        <div className="body-3 text-muted">
          {tools.length} tool{tools.length !== 1 ? "s" : ""}
        </div>
      </div>
      <ChevronRight size={16} className="text-muted shrink-0" />
    </button>
  );
}
