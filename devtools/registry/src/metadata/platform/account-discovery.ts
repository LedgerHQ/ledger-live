import { Category, type ToolMetadata } from "../../types";
export type { AccountDiscoveryToolProps } from "@devtools/account-discovery";

export const accountDiscovery: ToolMetadata = {
  label: "Discovery",
  category: Category.ACCOUNTS,
  owner: "Platform",
  desc: "Scan a currency on the device: each candidate derived, then asked to the account data sources.",
  loader: () => import("@devtools/account-discovery"),
  platform: "web",
};
