import { Category, ToolKind, type ToolMetadata } from "../../types";

export type { AppTogglesToolProps } from "@devtools/app-toggles";

export const appToggles: ToolMetadata = {
  label: "app-toggles",
  kind: ToolKind.TOOL,
  category: Category.CONFIGURATION,
  owner: "Wallet XP",
  desc: "App-wide developer toggles, such as hiding the pre-release overlay. A toggle that can't apply on this build is locked.",
  loader: () => import("@devtools/app-toggles").then(({ AppToggles }) => ({ default: AppToggles })),
  platform: "web",
};
