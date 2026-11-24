import { Category, ToolKind, type ToolMetadata } from "../../types";

export type { ReceiveToolProps } from "@devtools/receive";

export const receive: ToolMetadata = {
  label: "Receive",
  kind: ToolKind.FEATURE,
  category: Category.FEATURES_AND_FLOWS,
  owner: "Wallet XP",
  desc: "Drive the new receive flow: toggle its feature flag and excluded families.",
  loader: () => import("@devtools/receive").then(({ Receive }) => ({ default: Receive })),
};
