import { parse, type Tool } from "@devtools/core";

export function makeTool(
  partial: Omit<Tool, "component" | "id"> & { component?: Tool["component"]; id: string },
): Tool {
  return {
    optional: true,
    ...partial,
    id: parse(partial.id),
    component: partial.component ?? (() => null),
  };
}
