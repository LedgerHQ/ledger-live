import { Category, ToolKind, type ToolMetadata } from "../../types";
export type { AccountDiscoveryToolProps } from "@devtools/account-discovery";

export const accountDiscovery: ToolMetadata = {
  label: "account-discovery",
  kind: ToolKind.FEATURE,
  category: Category.ACCOUNTS,
  owner: "Platform",
  desc: "Scan a currency on the device: each candidate derived, then asked to the account data sources whether it was ever used.",
  loader: () => import("@devtools/account-discovery"),
  platform: "web",
};
