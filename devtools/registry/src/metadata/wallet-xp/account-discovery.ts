import { Category, type ToolMetadata } from "../../types";
export type { AccountDiscoveryToolProps } from "@devtools/account-discovery";

export const accountDiscovery: ToolMetadata = {
  label: "Account Discovery",
  category: Category.DEBUGGING,
  owner: "wallet-xp",
  desc: "Scan a currency for accounts: the discovery stream, as it arrives",
  loader: () => import("@devtools/account-discovery"),
  platform: "web",
};
