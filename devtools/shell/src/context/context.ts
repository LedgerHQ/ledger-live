import { createContext, createElement, useContext } from "react";
import type { ReactNode } from "react";
import type { DevToolsPropsRegistry } from "../index";
import type { Tool } from "../types";

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

export function useIsToolConfigured(tool: Tool): boolean {
  if (tool.optional) return true;
  const props = useToolProps(tool.id);
  return props !== undefined;
}
