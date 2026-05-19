import type { ComponentType } from "react";
import { parse } from "@devtools/core";
import type { DevToolsPropsRegistry, Tool } from "@devtools/core";

export const tools: Tool[] = [];

const toolsById = new Map<string, Tool>();

function addTool(tool: Tool): Tool {
  const existing = toolsById.get(tool.id);
  if (existing) {
    console.warn(`[@devtools/shell] duplicate tool id "${tool.id}" — second registration ignored.`);
    return existing;
  }
  toolsById.set(tool.id, tool);
  tools.push(tool);
  return tool;
}

export function setupDevTools(registerFns: Array<() => Tool | void>): Tool[] {
  return registerFns.flatMap(fn => fn() ?? []);
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
  return addTool({ ...tool, id: parse(tool.id), optional: false });
}

export function registerTool<K extends keyof DevToolsPropsRegistry>(tool: ToolInput<K>): Tool {
  return addTool({ ...tool, id: parse(tool.id), optional: true });
}
