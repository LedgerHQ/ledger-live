import type { AccountPortfolioAction } from "../types";

/** The calls that act on the portfolio of the Portfolio section, which needs an id. */
const PORTFOLIO_SCOPED: ReadonlySet<AccountPortfolioAction> = new Set([
  "getPortfolio",
  "createPortfolio",
  "registerAccounts",
  "removeRegistrations",
  "addAddresses",
  "getBalance",
  "getBalanceHistory",
  "getUpdates",
]);

/** The Network and Write calls act on a chain, not on a portfolio. */
export const needsPortfolio = (action: AccountPortfolioAction): boolean =>
  PORTFOLIO_SCOPED.has(action);
