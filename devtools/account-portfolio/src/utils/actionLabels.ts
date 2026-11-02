import type { AccountPortfolioAction } from "../types";

export const ACTION_LABEL: Record<AccountPortfolioAction, string> = {
  getPortfolio: "Get portfolio",
  createPortfolio: "Create portfolio",
  registerAccounts: "Register accounts",
  removeRegistrations: "Remove registrations",
  addAddresses: "Add addresses",
  getBalance: "Get balance",
  getBalanceHistory: "Get balance history",
  getUpdates: "Get updates",
};
