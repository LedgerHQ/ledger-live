import { Category, ToolKind, type ToolMetadata } from "../../types";
export type { AccountOperationToolProps } from "@devtools/account-operation";

export const accountOperation: ToolMetadata = {
  label: "account-operation",
  kind: ToolKind.ENTITY,
  category: Category.ACCOUNTS,
  owner: "Wallet XP",
  desc: "The operations kind of each account: read it page by page, see its rows and its read status.",
  loader: () => import("@devtools/account-operation"),
  platform: "web",
};
