import { Category, type ToolMetadata } from "../../types";
export type { AccountBalancesToolProps } from "@devtools/account-balances";

export const accountBalances: ToolMetadata = {
  label: "Account Balances",
  category: Category.DEBUGGING,
  owner: "wallet-xp",
  desc: "List accounts and read their balance through the account-data layer",
  loader: () => import("@devtools/account-balances"),
  platform: "web",
};
