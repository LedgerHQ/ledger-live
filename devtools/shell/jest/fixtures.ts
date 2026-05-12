import type { Tool } from "../src/types";

declare module "../src/index" {
  interface DevToolsPropsRegistry {
    "test-tool"?: { value: string };
  }
}

export function makeTool(partial: Omit<Tool, "component">): Tool {
  return { ...partial, component: () => null };
}
