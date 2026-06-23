import { createContext, createElement, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Category, Tool } from "@devtools/registry";

export interface CategoryGroup {
  readonly category: Category;
  readonly tools: Tool[];
}

export interface DevToolsShellValue {
  readonly categories: CategoryGroup[];
}

interface DevToolsShellContextValue extends DevToolsShellValue {
  readonly query: string;
  readonly setQuery: (query: string) => void;
}

const DevToolsShellContext = createContext<DevToolsShellContextValue>({
  categories: [],
  query: "",
  setQuery: () => {},
});

export function DevToolsShellProvider({
  value,
  children,
}: {
  value: DevToolsShellValue;
  children: ReactNode;
}) {
  const [query, setQuery] = useState("");
  const contextValue = useMemo<DevToolsShellContextValue>(
    () => ({ ...value, query, setQuery }),
    [value, query],
  );
  return createElement(DevToolsShellContext.Provider, { value: contextValue }, children);
}

export function useDevToolsShell(): DevToolsShellContextValue {
  return useContext(DevToolsShellContext);
}
