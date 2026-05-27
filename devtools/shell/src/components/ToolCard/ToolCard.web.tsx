import { ChevronRight } from "@ledgerhq/lumen-ui-react/symbols";
import type { Tool, ToolId } from "@devtools/registry";
import { IconSquare } from "../IconSquare/IconSquare.web";

interface ToolCardProps {
  tool: Tool;
  onSelect: (id: ToolId) => void;
}

export function ToolCard({ tool, onSelect }: ToolCardProps) {
  return (
    <button
      className="flex items-center gap-12 p-12 rounded-md bg-surface-hover hover:ring-1 hover:ring-muted text-left w-full border-none cursor-pointer"
      onClick={() => onSelect(tool.id)}
    >
      <IconSquare category={tool.category} />
      <div className="flex-1 min-w-0">
        <div className="body-2 font-semibold truncate">{tool.label}</div>
        <div className="body-3 text-muted truncate">{tool.category}</div>
      </div>
      <ChevronRight size={16} className="text-muted shrink-0" />
    </button>
  );
}
