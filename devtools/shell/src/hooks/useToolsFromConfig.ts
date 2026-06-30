import { useMemo } from "react";
import { tools as registry, type DevToolsConfig, type ToolPlatform } from "@devtools/registry";
import { filterToolsByPlatform } from "../utils/toolsUtils";
import { lazyComponentsById } from "../DevTools/LazyComponents";
import { useDevToolsNavigation } from "./useDevToolsNavigation";

/**
 * Resolves a host `config` into platform-filtered, category-grouped navigation state.
 *
 * Shared by the web and native shells — only the `platform` argument differs.
 * Looks each enabled tool up in the registry, attaches its lazily loaded
 * component, drops tools that don't target `platform`, and groups the rest into
 * categories via {@link useDevToolsNavigation}.
 */
export function useToolsFromConfig(config: DevToolsConfig, platform: ToolPlatform) {
  const tools = useMemo(
    () =>
      config.map(item => {
        const tool = registry[item.id];
        if (!tool) {
          throw new Error(`Unknown devtools tool id: "${item.id}"`);
        }
        return { id: item.id, ...tool, component: lazyComponentsById[item.id] };
      }),
    [config],
  );

  const platformTools = useMemo(() => filterToolsByPlatform(tools, platform), [tools, platform]);

  return useDevToolsNavigation(platformTools);
}
