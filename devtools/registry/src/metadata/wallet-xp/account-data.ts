import { Category, type ToolMetadata } from "../../types";

export type { AccountDataToolProps } from "@devtools/account-data";

export const accountData: ToolMetadata = {
  label: "Account Data",
  category: Category.DEBUGGING,
  owner: "Wallet XP",
  desc: "Show what the account data stores hold for each account of the accounts slice, and read through the account data layer.",
  loader: () => import("@devtools/account-data"),
  platform: "web",
};
