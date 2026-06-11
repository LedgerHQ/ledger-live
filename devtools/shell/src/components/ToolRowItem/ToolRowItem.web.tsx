import type { Tool } from "@devtools/registry";
import { ToolRow } from "../ToolRow/ToolRow.web";

interface ToolRowItemProps {
  tool: Tool;
  isActive: boolean;
  onSelect: () => void;
}

export function ToolRowItem({ tool, isActive, onSelect }: ToolRowItemProps) {
  return <ToolRow title={tool.label} isActive={isActive} onClick={onSelect} owner={tool.owner} />;
}
