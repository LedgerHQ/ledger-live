import { registerTool, Category } from "@devtools/shell";
import type { FeatureFlagsToolProps } from "./types";

export const FEATURE_FLAGS_ID = "feature-flags" as const;

declare module "@devtools/shell" {
  interface DevToolsPropsRegistry {
    [FEATURE_FLAGS_ID]?: FeatureFlagsToolProps;
  }
}

export function registerFeatureFlagsTool() {
  registerTool({
    id: FEATURE_FLAGS_ID,
    label: "Feature Flags",
    category: Category.CONFIGURATION,
    component: () => null,
    owner: "Platform",
    desc: "Toggle feature flags at runtime.",
  });
}
