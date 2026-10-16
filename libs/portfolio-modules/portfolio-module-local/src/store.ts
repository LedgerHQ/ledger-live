import { createMemoryHistoryStore, type HistoryStore } from "@ledgerhq/account-module-framework";
import type { PortfolioStore, StoredPortfolio } from "./types";

/** A store kept in memory: for tests, and for clients that persist its content themselves. */
export function createMemoryPortfolioStore(): PortfolioStore {
  const portfolios = new Map<string, StoredPortfolio>();
  const histories = new Map<string, HistoryStore>();
  return {
    get: async portfolioId => {
      const portfolio = portfolios.get(portfolioId);
      return portfolio && structuredClone(portfolio);
    },
    put: async portfolio => {
      portfolios.set(portfolio.id, structuredClone(portfolio));
    },
    history: accountId => {
      const history = histories.get(accountId) ?? createMemoryHistoryStore();
      histories.set(accountId, history);
      return history;
    },
    findAccount: async (network, key) => {
      for (const portfolio of portfolios.values()) {
        const account = portfolio.accounts.find(
          account => account.network === network && account.descriptor?.key === key,
        );
        if (account) return { portfolioId: portfolio.id, accountId: account.id };
      }
      return undefined;
    },
  };
}
