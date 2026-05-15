import type { ComponentType } from "react";
import type { Tool } from "../types";
import type { DevToolsPropsRegistry } from "../index";

export const tools: Tool[] = [];

const allToolIds = new Set<string>();

function addTool(tool: Tool): boolean {
  if (allToolIds.has(tool.id)) {
    console.warn(`[@devtools/shell] duplicate tool id "${tool.id}" — second registration ignored.`);
    return false;
  }
  allToolIds.add(tool.id);
  tools.push(tool);
  return true;
}

type ToolInput<K extends keyof DevToolsPropsRegistry> = Omit<
  Tool,
  "id" | "component" | "optional"
> & {
  id: K;
  component: ComponentType<NonNullable<DevToolsPropsRegistry[K]>>;
};

export function registerToolWithRequiredProps<K extends keyof DevToolsPropsRegistry>(
  tool: ToolInput<K>,
): Tool {
  const registered: Tool = { ...tool, optional: false };
  addTool(registered);
  return registered;
}

export function registerTool<K extends keyof DevToolsPropsRegistry>(tool: ToolInput<K>): Tool {
  const registered: Tool = { ...tool, optional: true };
  addTool(registered);
  return registered;
}
