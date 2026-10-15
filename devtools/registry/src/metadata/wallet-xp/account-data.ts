import { Category, type ToolMetadata } from "../../types";

export type { AccountDataToolProps } from "@devtools/account-data";

export const accountData: ToolMetadata = {
  label: "Account Data",
  category: Category.DEBUGGING,
  owner: "Wallet XP",
  desc: "Read accounts' balances and operations through the account data layer, and see which source answered.",
  loader: () => import("@devtools/account-data"),
  platform: "web",
};
