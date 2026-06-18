import { useMemo } from "react";
import { useToolsFromConfig } from "../hooks";
import type { DevToolsShellValue } from "../context";
import type { DevToolsConfig } from "@devtools/registry";

interface DevToolsInput {
  config: DevToolsConfig;
}

export interface DevToolsViewProps {
  shell: DevToolsShellValue;
}

export function useDevToolsViewModel({ config }: DevToolsInput): DevToolsViewProps {
  const { categories } = useToolsFromConfig(config, "native");
  const shell = useMemo(() => ({ categories }), [categories]);

  return { shell };
}
