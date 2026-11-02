import { Category, ToolKind, type ToolMetadata } from "../../types";
export type { AccountDescriptorToolProps } from "@devtools/account-descriptor";

export const accountDescriptor: ToolMetadata = {
  label: "account-descriptor",
  kind: ToolKind.ENTITY,
  category: Category.ACCOUNTS,
  owner: "Platform",
  desc: "The accounts slice: each account's UUID, descriptor and legacy id.",
  loader: () => import("@devtools/account-descriptor"),
  platform: "web",
};
