import { createContext, createElement, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import type { DevToolsConfig, ToolId } from "@devtools/registry";

type DevToolsContextValue = Map<ToolId, unknown>;

const EMPTY_VALUE: DevToolsContextValue = new Map();
const DevToolsContext = createContext<DevToolsContextValue>(EMPTY_VALUE);

export function DevToolsProvider({
  value,
  children,
}: {
  value?: DevToolsConfig;
  children: ReactNode;
}) {
  const map = useMemo<DevToolsContextValue>(() => {
    if (!value || value.length === 0) return EMPTY_VALUE;
    const m = new Map<ToolId, unknown>();
    for (const entry of value) m.set(entry.id, entry.config);
    return m;
  }, [value]);
  return createElement(DevToolsContext.Provider, { value: map }, children);
}

export function useToolProps(id: ToolId): unknown {
  return useContext(DevToolsContext).get(id);
}
