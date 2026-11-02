import { Category, ToolKind, type ToolMetadata } from "../../types";
export type { AccountBalanceHistoryToolProps } from "@devtools/account-balance-history";

export const accountBalanceHistory: ToolMetadata = {
  label: "account-balance-history",
  kind: ToolKind.ENTITY,
  category: Category.ACCOUNTS,
  owner: "Wallet XP",
  desc: "The balanceHistory kind of each account: read it for a range, see each asset's series and the read status.",
  loader: () => import("@devtools/account-balance-history"),
  platform: "web",
};
