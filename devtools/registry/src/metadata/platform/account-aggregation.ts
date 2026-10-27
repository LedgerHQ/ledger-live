import { Category, type ToolMetadata } from "../../types";
export type { AccountAggregationToolProps } from "@devtools/account-aggregation";

export const accountAggregation: ToolMetadata = {
  label: "Aggregation",
  category: Category.ACCOUNTS,
  owner: "Platform",
  desc: "Fetch the total balance of every account in one batch, and see which source answered what.",
  loader: () => import("@devtools/account-aggregation"),
  platform: "web",
};
