import { createContext, createElement, useContext } from "react";
import type { ReactNode } from "react";
import type { DevToolsPropsRegistry } from "../index";
import { registeredToolIds } from "../registry/tools";

const EMPTY_VALUE: Partial<DevToolsPropsRegistry> = {};
const DevToolsContext = createContext<Partial<DevToolsPropsRegistry>>(EMPTY_VALUE);

export function DevToolsProvider({
  value,
  children,
}: {
  value?: Partial<DevToolsPropsRegistry>;
  children: ReactNode;
}) {
  return createElement(DevToolsContext.Provider, { value: value ?? EMPTY_VALUE }, children);
}

export function useToolProps<K extends keyof DevToolsPropsRegistry>(
  id: K,
): DevToolsPropsRegistry[K] | undefined {
  return useContext(DevToolsContext)[id];
}

export function useIsToolConfigured(id: string): boolean {
  const context = useContext(DevToolsContext);
  if (!registeredToolIds.has(id)) return true;
  return id in context;
}
