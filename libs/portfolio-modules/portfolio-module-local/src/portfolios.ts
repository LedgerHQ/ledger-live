import { PortfolioApiError, type PortfolioApi } from "@ledgerhq/portfolio-module-framework";
import { register, registerAddresses } from "./registrations";
import { requirePortfolio, toPortfolio } from "./stored";
import type { LocalPortfolioDeps, StoredPortfolio } from "./types";

type PortfolioEndpoints = Pick<
  PortfolioApi,
  "getPortfolio" | "createPortfolio" | "addRegistrations" | "removeRegistrations" | "addAddresses"
>;

export function portfolioEndpoints(deps: LocalPortfolioDeps): PortfolioEndpoints {
  const { store } = deps;

  const save = async (portfolio: StoredPortfolio) => {
    await store.put(portfolio);
    return toPortfolio(portfolio);
  };

  return {
    getPortfolio: async portfolioId => toPortfolio(await requirePortfolio(store, portfolioId)),

    createPortfolio: async portfolioId => {
      const existing = await store.get(portfolioId);
      return existing
        ? toPortfolio(existing)
        : save({ id: portfolioId, registrations: [], accounts: [] });
    },

    addRegistrations: async (portfolioId, inputs) => {
      const portfolio = await requirePortfolio(store, portfolioId);
      const registrations = [...portfolio.registrations];
      const accounts = [...portfolio.accounts];
      const accountIds = new Set(accounts.map(({ id }) => id));
      const registered = inputs.map(input => ({ input, ...register(deps, input) }));
      for (const { registration, accounts: brought } of registered) {
        registrations.push(registration);
        const newAccounts = brought.filter(({ id }) => !accountIds.has(id));
        for (const account of newAccounts) accountIds.add(account.id);
        accounts.push(...newAccounts);
      }
      const saved = await save({ ...portfolio, registrations, accounts });
      for (const { input, accounts: brought } of registered) {
        registerAddresses(deps.networks, input, brought);
      }
      return saved;
    },

    removeRegistrations: async (portfolioId, registrationIds) => {
      const portfolio = await requirePortfolio(store, portfolioId);
      const removed = new Set(registrationIds);
      return save({
        ...portfolio,
        registrations: portfolio.registrations.filter(({ id }) => !removed.has(id)),
        accounts: portfolio.accounts.filter(({ registrationId }) => !removed.has(registrationId)),
      });
    },

    addAddresses: async (portfolioId, accountId) => {
      const portfolio = await requirePortfolio(store, portfolioId);
      if (!portfolio.accounts.some(({ id }) => id === accountId)) {
        throw new PortfolioApiError("NOT_FOUND", `Account ${accountId} not found`);
      }
      throw new PortfolioApiError(
        "BAD_REQUEST",
        `The addresses of local account ${accountId} are managed by its account module`,
      );
    },
  };
}
