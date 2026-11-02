import { Category, ToolKind, type ToolMetadata } from "../../types";
export type { MockAccountsToolProps } from "@devtools/mock-accounts";

export const mockAccounts: ToolMetadata = {
  label: "mock-accounts",
  kind: ToolKind.TOOL,
  category: Category.ACCOUNTS,
  owner: "Platform",
  desc: "Generates mock account descriptors and serves their data from a MockSource.",
  loader: () => import("@devtools/mock-accounts"),
  platform: "web",
};
