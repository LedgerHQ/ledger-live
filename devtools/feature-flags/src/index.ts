import { Category, FEATURE_FLAGS_ID, createTool } from "@devtools/core";
import type { ToolDescriptor } from "@devtools/core";
import { FeatureFlags } from "./FeatureFlags";

const descriptor: ToolDescriptor<typeof FEATURE_FLAGS_ID> = {
  id: FEATURE_FLAGS_ID,
  label: "Feature Flags",
  category: Category.CONFIGURATION,
  component: FeatureFlags,
  owner: "Platform",
  desc: "Toggle feature flags at runtime.",
};

const tool = createTool(descriptor);
export default tool;

export { FEATURE_FLAGS_ID } from "@devtools/core";
export type { FeatureFlagsToolProps, FlagDisplayState, FlagFilter } from "./types";
export { ALL_FLAG_IDS } from "./constants";
export { useFeatureFlagsState, useFeatureFlagsFilters } from "./hooks";
export type {
  FeatureFlagsToolState,
  FeatureFlagsFiltersState,
  FeatureFlagsFiltersInput,
} from "./hooks";
