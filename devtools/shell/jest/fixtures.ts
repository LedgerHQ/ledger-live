import type { Tool } from "../src/types";

export function makeTool(partial: Omit<Tool, "component" | "optional">): Tool {
  return { optional: true, ...partial, component: () => null };
}
