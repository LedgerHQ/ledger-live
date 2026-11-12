import { Category, ToolKind, type ToolMetadata } from "../../types";
export type { ReceiveToolProps } from "@devtools/receive";

export const receive: ToolMetadata = {
  label: "Receive",
  kind: ToolKind.FEATURE,
  category: Category.FEATURES_AND_FLOWS,
  owner: "Wallet XP",
  desc: "New receive flow: feature flag, verify hint and receive any asset",
  loader: () => import("@devtools/receive"),
};
