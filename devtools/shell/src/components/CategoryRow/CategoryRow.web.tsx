import { ChevronDown, ChevronRight } from "@ledgerhq/lumen-ui-react/symbols";
import type { Category, Tool, ToolId, ValueOf } from "@devtools/registry";
import type { IconComponent } from "../../categoryConfig";
import { ToolRowItem } from "../ToolRowItem/ToolRowItem.web";

interface CategoryRowProps {
  category: ValueOf<typeof Category>;
  tools: Tool[];
  icon: IconComponent;
  isExpanded: boolean;
  onToggle: () => void;
  activeToolId: ToolId | undefined;
  onSelectTool: (id: ToolId) => void;
}

export function CategoryRow({
  category,
  tools,
  icon: Icon,
  isExpanded,
  onToggle,
  activeToolId,
  onSelectTool,
}: CategoryRowProps) {
  return (
    <li className="flex flex-col">
      <button
        className="w-full flex items-center gap-8 px-8 py-8 body-3 font-semibold uppercase tracking-wider text-muted rounded-lg hover:bg-surface-hover cursor-pointer border-none bg-transparent"
        aria-label={category}
        aria-expanded={isExpanded}
        onClick={onToggle}
      >
        <span className="text-muted inline-flex shrink-0">
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
        <span className="text-muted inline-flex shrink-0">
          <Icon size={16} />
        </span>
        <span className="flex-1 text-left">{category}</span>
        <span className="body-3 font-medium normal-case tracking-normal">{tools.length}</span>
      </button>
      {isExpanded && (
        <ul className="flex flex-col list-none mt-4 mb-4">
          {tools.map(tool => (
            <li key={tool.id}>
              <ToolRowItem
                tool={tool}
                isActive={activeToolId === tool.id}
                onSelect={() => onSelectTool(tool.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
