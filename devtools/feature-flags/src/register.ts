import { registerToolWithRequiredProps } from "@devtools/shell";
import { Category, FEATURE_FLAGS_ID } from "@devtools/core";
import type { FeatureFlagsToolProps } from "./types";
import { FeatureFlags } from "./FeatureFlags";

declare module "@devtools/core" {
  interface DevToolsPropsRegistry {
    [FEATURE_FLAGS_ID]?: FeatureFlagsToolProps;
  }
}

export function registerFeatureFlagsTool() {
  registerToolWithRequiredProps({
    id: FEATURE_FLAGS_ID,
    label: "Feature Flags",
    category: Category.CONFIGURATION,
    component: FeatureFlags,
    owner: "Platform",
    desc: "Toggle feature flags at runtime.",
  });
}
