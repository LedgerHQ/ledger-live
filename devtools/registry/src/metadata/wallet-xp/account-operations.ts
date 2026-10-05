import { Category, type ToolMetadata } from "../../types";
export type { AccountOperationsToolProps } from "@devtools/account-operations";

export const accountOperations: ToolMetadata = {
  label: "Account Operations",
  category: Category.DEBUGGING,
  owner: "wallet-xp",
  desc: "Read an account's history one page at a time, and see what a page cannot tell you",
  loader: () => import("@devtools/account-operations"),
  platform: "web",
};
