import { Category, ToolKind, type ToolMetadata } from "../../types";

export type { DevSettingsToolProps } from "@devtools/dev-settings";

export const devSettings: ToolMetadata = {
  label: "dev-settings",
  kind: ToolKind.TOOL,
  category: Category.CONFIGURATION,
  owner: "Wallet XP",
  desc: "App-wide developer settings, such as hiding the pre-release overlay. A setting that can't apply on this build is locked.",
  loader: () =>
    import("@devtools/dev-settings").then(({ DevSettings }) => ({ default: DevSettings })),
  platform: "web",
};
