import { Category, ToolKind, type ToolMetadata } from "../../types";
export type { AccountNameToolProps } from "@devtools/account-name";

export const accountName: ToolMetadata = {
  label: "account-name",
  kind: ToolKind.ENTITY,
  category: Category.ACCOUNTS,
  owner: "Platform",
  desc: "The account names slice: each name, looked up by account UUID.",
  loader: () => import("@devtools/account-name"),
  platform: "web",
};
