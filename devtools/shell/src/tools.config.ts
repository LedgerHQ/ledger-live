import { Category } from "./types";
import type { Tool } from "./types";
import { FEATURE_FLAGS_ID } from "./toolIds";

const FeatureFlagsPlaceholder = () => null;

export const TOOLS: Tool[] = [
  {
    id: FEATURE_FLAGS_ID,
    label: "Feature Flags",
    category: Category.CONFIGURATION,
    component: FeatureFlagsPlaceholder,
    owner: "Platform",
    desc: "Toggle feature flags at runtime.",
  },
];
