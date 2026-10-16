import {
  PortfolioApiError,
  type PortfolioApi,
  type TransactionIntentView,
} from "@ledgerhq/portfolio-module-framework";
import { createRequest, route } from "./http";
import type { PortfolioServiceClientConfig } from "./types";

/**
 * The intent as the service defines it: the extension fields (`assetInfo`, `intentType`) left out.
 * A staking intent is refused: without its type, the service would craft a plain transfer.
 */
export function serviceIntent({
  intentType,
  type,
  sender,
  senderPublicKey,
  recipient,
  amount,
  asset,
  feesStrategy,
  networkParams,
}: TransactionIntentView): TransactionIntentView {
  if (intentType === "staking") {
    throw new PortfolioApiError(
      "BAD_REQUEST",
      "staking intents are not served by the portfolio-service",
    );
  }
  return {
    type,
    sender,
    ...(senderPublicKey === undefined ? {} : { senderPublicKey }),
    ...(recipient === undefined ? {} : { recipient }),
    ...(amount === undefined ? {} : { amount }),
    ...(asset === undefined ? {} : { asset }),
    ...(feesStrategy === undefined ? {} : { feesStrategy }),
    ...(networkParams === undefined ? {} : { networkParams }),
  };
}

/**
 * The `PortfolioApi` answered by a portfolio-service instance. It serves no extension, and its
 * request bodies carry the service's fields only.
 */
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

    // The validation parameters are an extension: the service validates the address alone.
    validateAddress: (network, address) =>
      request("GET", route`/v1/${network}/validate-address`, { query: { address } }),

    getNextSequence: (network, address) =>
      request("GET", route`/v1/${network}/account/${address}/next-sequence`),

    estimateTransactionFee: async (network, { intent }) =>
      request("POST", route`/v1/${network}/transaction/estimate`, {
        body: { intent: serviceIntent(intent) },
      }),

    encodeTransaction: async (network, { intent, customFees }) =>
      request("POST", route`/v1/${network}/transaction/encode`, {
        body: {
          intent: serviceIntent(intent),
          ...(customFees === undefined ? {} : { customFees }),
        },
      }),

    combineTransaction: (network, { rawTransaction, signature, pubkey }) =>
      request("POST", route`/v1/${network}/transaction/combine`, {
        body: { rawTransaction, signature, ...(pubkey === undefined ? {} : { pubkey }) },
      }),

    // The broadcast configuration is an extension: the service broadcasts the transaction alone.
    broadcastTransaction: (network, { signedTransaction }) =>
      request("POST", route`/v1/${network}/transaction/broadcast`, {
        body: { signedTransaction },
      }),
  };
}
