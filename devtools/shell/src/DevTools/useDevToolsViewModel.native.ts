import { useMemo } from "react";
import { useToolsFromConfig } from "../hooks";
import type { DevToolsShellValue } from "../context";
import type { DevToolsConfig } from "@devtools/registry";

interface DevToolsInput {
  config: DevToolsConfig;
  footer?: React.ReactNode;
}

export interface DevToolsViewProps {
  shell: DevToolsShellValue;
  footer?: React.ReactNode;
}

export function useDevToolsViewModel({ config, footer }: DevToolsInput): DevToolsViewProps {
  const { categories } = useToolsFromConfig(config, "native");
  const shell = useMemo(() => ({ categories, footer }), [categories, footer]);

  return { shell };
}
