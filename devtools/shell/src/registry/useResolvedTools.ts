import { use, useMemo } from "react";
import type { Tool, ToolId, ToolLoaders } from "@devtools/core";
import { loadTool, parse } from "@devtools/core";

export interface ResolvedTools {
  tools: Tool[];
  failures: Array<{ id: ToolId; error: Error }>;
}

export function useResolvedTools(loaders: ToolLoaders): ResolvedTools {
  const ids = Object.keys(loaders).map(parse);
  const key = ids.join(",");
  const promise = useMemo(() => Promise.all(ids.map(id => loadTool(id, loaders[id]!))), [key]);
  const results = use(promise);
  return useMemo(
    () => ({
      tools: results.flatMap(r => ("descriptor" in r ? [r.descriptor] : [])),
      failures: results.flatMap(r => ("error" in r ? [r] : [])),
    }),
    [results],
  );
}
