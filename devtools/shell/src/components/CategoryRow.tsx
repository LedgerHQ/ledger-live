import { ChevronDown, ChevronRight } from "@ledgerhq/lumen-ui-react/symbols";
import type { Tool } from "../types";
import { ToolRow } from "./ToolRow";

// IconProps and IconSize are not exported from @ledgerhq/lumen-ui-react.
// ChevronDown is already imported and shares the same props shape as all lumen symbols,
// so we derive the icon component type from it to stay in sync with the package.
type IconComponent = typeof ChevronDown;

interface CategoryRowProps {
  category: string;
  tools: Tool[];
  icon: IconComponent;
  isExpanded: boolean;
  onToggle: () => void;
  activeToolId: string | undefined;
  onSelectTool: (id: string) => void;
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
              <ToolRow
                title={tool.label}
                isActive={activeToolId === tool.id}
                onClick={() => onSelectTool(tool.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
