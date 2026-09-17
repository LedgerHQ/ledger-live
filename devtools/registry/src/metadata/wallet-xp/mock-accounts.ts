import { Category, type ToolMetadata } from "../../types";

export type { MockAccountsToolProps } from "@devtools/mock-accounts";

export const mockAccounts: ToolMetadata = {
  label: "Mock Accounts",
  category: Category.GENERATORS,
  owner: "Wallet XP",
  desc: "Generate mock accounts by count, currency, or type (cryptos / stablecoins / stocks).",
  loader: () => import("@devtools/mock-accounts"),
};
