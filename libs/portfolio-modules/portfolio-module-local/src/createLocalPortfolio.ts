import { getPortfolioBalanceHistory } from "./balanceHistory";
import { getPortfolioBalance } from "./balances";
import { networkEndpoints } from "./networkEndpoints";
import { portfolioEndpoints } from "./portfolios";
import { syncPortfolio } from "./sync";
import type { LocalPortfolioApi, LocalPortfolioConfig, LocalPortfolioDeps } from "./types";
import { getUpdates } from "./updates";
import { writeEndpoints } from "./write";

/**
 * The portfolio API served locally: portfolios kept in the client's store, every account delegated
 * to the account module of its network.
 */
export function createLocalPortfolio({
  networks,
  store,
  generateId = () => crypto.randomUUID(),
  now = Date.now,
}: LocalPortfolioConfig): LocalPortfolioApi {
  const deps: LocalPortfolioDeps = { networks, store, generateId, now };
  return {
    ...portfolioEndpoints(deps),
    sync: (portfolioId, options) => syncPortfolio(deps, portfolioId, options),
    getUpdates: (portfolioId, query) => getUpdates(deps, portfolioId, query),
    getPortfolioBalance: (portfolioId, query) => getPortfolioBalance(deps, portfolioId, query),
    getPortfolioBalanceHistory: (portfolioId, query) =>
      getPortfolioBalanceHistory(deps, portfolioId, query),
    ...networkEndpoints(deps),
    ...writeEndpoints(deps),
  };
}
