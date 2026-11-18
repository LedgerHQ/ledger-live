import { Category, ToolKind, type ToolMetadata } from "../../types";
export type { AccountStatusToolProps } from "@devtools/account-status";

export const accountStatus: ToolMetadata = {
  label: "account-status",
  kind: ToolKind.ENTITY,
  category: Category.ACCOUNTS,
  owner: "Platform",
  desc: "The accountStatus and assetStatus kinds of each account: ever used, its gate, and per asset read its gate and receive gate.",
  loader: () => import("@devtools/account-status"),
  platform: "web",
};
