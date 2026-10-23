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
  listNetworks: "List networks",
  getLastBlock: "Get last block",
  getValidators: "Get validators",
  validateAddress: "Validate address",
  getNextSequence: "Get next sequence",
  estimateFee: "Estimate fee",
  encodeTransaction: "Encode transaction",
  combineTransaction: "Combine with signature",
  broadcastTransaction: "Broadcast transaction",
};
