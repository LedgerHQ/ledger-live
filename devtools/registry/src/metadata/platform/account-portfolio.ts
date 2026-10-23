import { Category, type ToolMetadata } from "../../types";
export type { AccountPortfolioToolProps } from "@devtools/account-portfolio";

export const accountPortfolio: ToolMetadata = {
  label: "Portfolio API",
  category: Category.ACCOUNTS,
  owner: "Platform",
  desc: "Trigger Portfolio service calls: create portfolio, register accounts, read balance and updates.",
  loader: () => import("@devtools/account-portfolio"),
  platform: "web",
};
