import { Category, ToolKind, type ToolMetadata } from "../../types";
export type { AccountReceiveToolProps } from "@devtools/account-receive";

export const accountReceive: ToolMetadata = {
  label: "account-receive",
  kind: ToolKind.ENTITY,
  category: Category.ACCOUNTS,
  owner: "Platform",
  desc: "The receive kind of each account: its address, how the device confirms it, its read status.",
  loader: () => import("@devtools/account-receive"),
  platform: "web",
};
