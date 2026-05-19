import type { Tool } from "@devtools/core";
import { ToolRow } from "../ToolRow/ToolRow.web";
import { useIsToolConfigured } from "../../context";

interface ToolRowItemProps {
  tool: Tool;
  isActive: boolean;
  onSelect: () => void;
}

export function ToolRowItem({ tool, isActive, onSelect }: ToolRowItemProps) {
  const isConfigured = useIsToolConfigured(tool);
  return (
    <ToolRow
      title={tool.label}
      isActive={isActive}
      onClick={onSelect}
      owner={tool.owner}
      disabled={!isConfigured}
    />
  );
}
