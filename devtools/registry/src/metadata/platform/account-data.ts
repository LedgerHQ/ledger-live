import { Category, type ToolMetadata } from "../../types";
export type { AccountDataToolProps } from "@devtools/account-data";

export const accountData: ToolMetadata = {
  label: "Account data",
  category: Category.ACCOUNTS,
  owner: "Platform",
  desc: "The account data layer at work: the status of every read and the history of its events.",
  loader: () => import("@devtools/account-data"),
  platform: "web",
};
