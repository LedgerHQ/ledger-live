import { Category, type ToolMetadata } from "../../types";
export type { AccountBalanceToolProps } from "@devtools/account-balance";

export const accountBalance: ToolMetadata = {
  label: "Balance",
  category: Category.ACCOUNTS,
  owner: "Platform",
  desc: "The balance kind of each account: read it, see its rows and its read status.",
  loader: () => import("@devtools/account-balance"),
  platform: "web",
};
