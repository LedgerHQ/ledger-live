import { Category, type ToolMetadata } from "../../types";
export type { MockAccountsToolProps } from "@devtools/mock-accounts";

export const mockAccounts: ToolMetadata = {
  label: "Mock accounts",
  category: Category.ACCOUNTS,
  owner: "Platform",
  desc: "Generates mock account descriptors and serves their data from a MockSource.",
  loader: () => import("@devtools/mock-accounts"),
  platform: "web",
};
