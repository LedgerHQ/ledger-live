import { Category, ToolKind, type ToolMetadata } from "../../types";
export type { AccountPortfolioToolProps } from "@devtools/account-portfolio";

export const accountPortfolio: ToolMetadata = {
  label: "account-portfolio",
  kind: ToolKind.API,
  category: Category.APIS,
  owner: "Platform",
  desc: "Trigger Portfolio service calls: create portfolio, register accounts, read balance and updates.",
  loader: () => import("@devtools/account-portfolio"),
  platform: "web",
};
