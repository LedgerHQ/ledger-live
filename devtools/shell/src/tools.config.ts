import { Category } from "./types";
import type { Tool } from "./types";

const FeatureFlagsPlaceholder = () => null;

export const TOOLS: Tool[] = [
  {
    id: "feature-flags",
    label: "Feature Flags",
    category: Category.CONFIGURATION,
    component: FeatureFlagsPlaceholder,
    owner: "Platform",
    desc: "Toggle feature flags at runtime.",
  },
];
