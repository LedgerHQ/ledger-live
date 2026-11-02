import { Category, ToolKind, type ToolMetadata } from "../../types";
export type { AppConfigToolProps } from "@devtools/app-config";

export const appConfig: ToolMetadata = {
  label: "app-config",
  kind: ToolKind.SHARED,
  category: Category.CONFIGURATION,
  owner: "Platform",
  desc: "Save an option of each config switch, or dev values, then reload once to apply them.",
  loader: () => import("@devtools/app-config").then(({ AppConfig }) => ({ default: AppConfig })),
};
