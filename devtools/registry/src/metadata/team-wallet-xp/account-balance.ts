import { Category, ToolKind, type ToolMetadata } from "../../types";
export type { AccountBalanceToolProps } from "@devtools/account-balance";

export const accountBalance: ToolMetadata = {
  label: "account-balance",
  kind: ToolKind.ENTITY,
  category: Category.ACCOUNTS,
  owner: "Wallet XP",
  desc: "The balance kind of each account: read it, see its rows and its read status.",
  loader: () => import("@devtools/account-balance"),
  platform: "web",
};
