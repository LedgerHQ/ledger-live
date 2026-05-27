import type { Tool } from "@devtools/registry";

export function makeTool(
  partial: Omit<Tool, "component"> & { component?: Tool["component"] },
): Tool {
  return {
    ...partial,
    component: partial.component ?? (() => null),
  };
}
