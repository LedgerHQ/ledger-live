import { Category, ToolKind, type ToolMetadata } from "../../types";
export type { FeatureFlagsToolProps } from "@devtools/feature-flags";

export const featureFlags: ToolMetadata = {
  label: "feature-flags",
  kind: ToolKind.SHARED,
  category: Category.CONFIGURATION,
  owner: "Platform",
  desc: "Toggle feature flags at runtime.",
  loader: () => import("@devtools/feature-flags"),
};
