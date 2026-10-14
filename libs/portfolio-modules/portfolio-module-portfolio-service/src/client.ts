import type { PortfolioApi } from "@ledgerhq/portfolio-module-framework";
import { createRequest, route } from "./http";
import type { PortfolioServiceClientConfig } from "./types";

/** The `PortfolioApi` answered by a portfolio-service instance. */
export function createPortfolioServiceClient(config: PortfolioServiceClientConfig): PortfolioApi {
  const request = createRequest(config);

  return {
    getPortfolio: portfolioId => request("GET", route`/v1/portfolio/${portfolioId}`),

    createPortfolio: portfolioId => request("PUT", route`/v1/portfolio/${portfolioId}`),

    addRegistrations: (portfolioId, registrations) =>
      request("POST", route`/v1/portfolio/${portfolioId}/registrations`, { body: registrations }),

    removeRegistrations: (portfolioId, registrationIds) =>
      request("DELETE", route`/v1/portfolio/${portfolioId}/registrations`, {
        body: registrationIds,
      }),

    addAddresses: (portfolioId, accountId, addresses) =>
      request("POST", route`/v1/portfolio/${portfolioId}/accounts/${accountId}/addresses`, {
        body: addresses,
      }),

    getUpdates: (portfolioId, { size, order, token, network, account, asset, address } = {}) =>
      request("GET", route`/v1/portfolio/${portfolioId}/updates`, {
        query: { size, order, token, network, account, asset, address },
      }),

    getPortfolioBalance: (
      portfolioId,
      { size, order, token, network, account, asset, currency } = {},
    ) =>
      request("GET", route`/v1/portfolio/${portfolioId}/balance`, {
        query: { size, order, token, network, account, asset, currency },
      }),

    getPortfolioBalanceHistory: (
      portfolioId,
      { size, order, token, range, currency, network, account, asset } = {},
    ) =>
      request("GET", route`/v1/portfolio/${portfolioId}/balance/history`, {
        query: { size, order, token, range, currency, network, account, asset },
      }),

    listNetworks: () => request("GET", "/v1/networks"),

    getLastBlock: network => request("GET", route`/v1/${network}/last-block`),

    getValidators: (network, { cursor } = {}) =>
      request("GET", route`/v1/${network}/validators`, { query: { cursor } }),

    validateAddress: (network, address) =>
      request("GET", route`/v1/${network}/validate-address`, { query: { address } }),

    getNextSequence: (network, address) =>
      request("GET", route`/v1/${network}/account/${address}/next-sequence`),

    estimateTransactionFee: (network, body) =>
      request("POST", route`/v1/${network}/transaction/estimate`, { body }),

    encodeTransaction: (network, body) =>
      request("POST", route`/v1/${network}/transaction/encode`, { body }),

    combineTransaction: (network, body) =>
      request("POST", route`/v1/${network}/transaction/combine`, { body }),

    broadcastTransaction: (network, body) =>
      request("POST", route`/v1/${network}/transaction/broadcast`, { body }),
  };
}
