import type { ComponentType } from "react";
import type { Tool } from "../types";
import type { DevToolsPropsRegistry } from "../index";

export const tools: Tool[] = [];

export const registeredToolIds = new Set<string>();
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

export function registerTool<K extends keyof DevToolsPropsRegistry>(
  tool: Tool & {
    id: K;
    component: ComponentType<NonNullable<DevToolsPropsRegistry[K]>>;
  },
): Tool {
  if (addTool(tool)) registeredToolIds.add(tool.id);
  return tool;
}

export function registerStandaloneTool(tool: Tool & { component: ComponentType }): Tool {
  addTool(tool);
  return tool;
}
