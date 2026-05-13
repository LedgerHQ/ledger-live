import { registerTool, Category } from "@devtools/shell";
import type { FeatureFlagsToolProps } from "./types";
import { FEATURE_FLAGS_ID } from "./constants";
import { FeatureFlags } from "./FeatureFlags";

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
    component: FeatureFlags,
    owner: "Platform",
    desc: "Toggle feature flags at runtime.",
  });
}
