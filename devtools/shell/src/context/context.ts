import { createContext, createElement, useContext } from "react";
import type { ReactNode } from "react";
import type { FeatureFlagsToolProps } from "../tools/feature-flags/types";
import { FEATURE_FLAGS_ID } from "../toolIds";

export type DevToolsPropsRegistry = {
  [FEATURE_FLAGS_ID]?: FeatureFlagsToolProps;
};

const DevToolsContext = createContext<DevToolsPropsRegistry>({});

export function DevToolsProvider({
  children,
  ...props
}: DevToolsPropsRegistry & { children: ReactNode }) {
  return createElement(DevToolsContext.Provider, { value: props }, children);
}

export function useToolProps<K extends keyof DevToolsPropsRegistry>(
  id: K,
): DevToolsPropsRegistry[K] {
  return useContext(DevToolsContext)[id];
}
