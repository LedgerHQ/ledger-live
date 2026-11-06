import { Category, ToolKind, type ToolMetadata } from "../../types";
export type { PortfolioSourceToolProps } from "@devtools/account-source-portfolio";

export const accountSourcePortfolio: ToolMetadata = {
  label: "account-source-portfolio",
  kind: ToolKind.FEATURE,
  category: Category.ACCOUNTS,
  owner: "Platform",
  desc: "The Portfolio account data source: local accounts against the service portfolio, reconcile, and what the source did.",
  loader: () => import("@devtools/account-source-portfolio"),
  platform: "web",
};
