import { createContext, createElement, useContext } from "react";
import type { ReactNode } from "react";
import type { DevToolsPropsRegistry, Tool, ToolId } from "@devtools/core";

type DevToolsContextValue = Partial<DevToolsPropsRegistry>;

const EMPTY_VALUE: DevToolsContextValue = {};
const DevToolsContext = createContext<DevToolsContextValue>(EMPTY_VALUE);

export function DevToolsProvider({
  value,
  children,
}: {
  value?: DevToolsContextValue;
  children: ReactNode;
}) {
  return createElement(DevToolsContext.Provider, { value: value ?? EMPTY_VALUE }, children);
}

export function useToolProps(id: ToolId): unknown {
  return useContext(DevToolsContext)[asRegisteredToolId(id)];
}

export function useToolBinding(tool: Tool) {
  const props = useContext(DevToolsContext)[asRegisteredToolId(tool.id)];
  return {
    isConfigured: tool.optional || props !== undefined,
    props: props ?? {},
  };
}

export function asRegisteredToolId(id: ToolId): keyof DevToolsPropsRegistry {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return id as keyof DevToolsPropsRegistry; // safe: only registered tool ids reach the context
}
