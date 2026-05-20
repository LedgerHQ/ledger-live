import { FEATURE_FLAGS_ID, type ToolId, type ToolLoader, type ToolLoaders } from "@devtools/core";

const ALL_LOADERS: Required<Record<ToolId, ToolLoader>> = {
  [FEATURE_FLAGS_ID]: () => import("@devtools/feature-flags"),
};

export function getToolLoaders(ids: Iterable<ToolId>): ToolLoaders {
  const loaders: ToolLoaders = {};
  for (const id of ids) {
    const loader = ALL_LOADERS[id];
    if (loader) loaders[id] = loader;
  }
  return loaders;
}
