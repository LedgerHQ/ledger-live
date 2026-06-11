import { type ComponentType, lazy, type LazyExoticComponent } from "react";
import { tools } from "@devtools/registry";

export const lazyComponentsById: Record<
  string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  LazyExoticComponent<ComponentType<any>>
> = Object.fromEntries(Object.entries(tools).map(([id, tool]) => [id, lazy(tool.loader)]));
