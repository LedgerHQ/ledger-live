import type { Tool } from "../src/types";

export function makeTool(partial: Omit<Tool, "component">): Tool {
  return { ...partial, component: () => null };
}
