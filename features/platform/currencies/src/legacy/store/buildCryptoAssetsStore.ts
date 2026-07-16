import type { SerializedError, ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { cryptoAssetsApi, type CryptoAssetsApi } from "@domain/api-currency-token";
import { LedgerAPI4xx, LedgerAPI5xx, NetworkDown } from "../../errors";
import type { CryptoAssetsStore } from "./port";

/**
 * Dispatch contract for the store: the app store's `dispatch`, used to run the
 * api's `initiate` thunks. The CAL api reducer must be registered in that store,
 * and its base URL is supplied via the store's `extraArgument` (`calApiExtra`).
 */
export type CryptoAssetsStoreDispatch = ThunkDispatch<unknown, unknown, UnknownAction>;

export interface BuildCryptoAssetsStoreConfig {
  /** The app store's `dispatch`. */
  dispatch: CryptoAssetsStoreDispatch;
  /** The CAL token api. Defaults to the shared `cryptoAssetsApi`; injectable for tests. */
  api?: CryptoAssetsApi;
}

/**
 * Builds a {@link CryptoAssetsStore} bound to an **existing** Redux store, over the
 * `@domain/api-currency-token` CAL RTK-Query api.
 *
 * Use this from an application composition root that already owns a configured store:
 * pass that store's `dispatch`. The CAL api's reducer and middleware must be
 * registered in the store, and its base URL + client version supplied through the
 * store's thunk `extraArgument` (see `calApiExtra`). Each method dispatches the
 * matching endpoint's `initiate` thunk, maps RTK-Query errors to the local error
 * taxonomy, and resolves with the cached data. Apps inject the result through the
 * legacy `setCryptoAssetsStore` singleton.
 *
 * For runtimes that do **not** own a Redux store (CLI scripts, monitoring, tests),
 * use {@link buildStandaloneCryptoAssetsStore}, which configures its own store from
 * the CAL configuration.
 *
 * @param config.dispatch
 * The host store's `dispatch`. Its reducer must include `cryptoAssetsApi.reducer`, its
 * middleware `cryptoAssetsApi.middleware`, and its thunk `extraArgument` the CAL
 * configuration (`calApiExtra`).
 *
 * @param config.api
 * The CAL token api. Defaults to the shared `cryptoAssetsApi`; override only to inject
 * a mock in tests.
 *
 * @returns
 * A {@link CryptoAssetsStore} — async `findTokenById`, `findTokenByAddressInCurrency`,
 * and `getTokensSyncHash`.
 *
 * @example
 * ```ts
 * // Inside an app that already configured its store:
 * const store = buildCryptoAssetsStore({ dispatch: reduxStore.dispatch });
 * const token = await store.findTokenById("ethereum/erc20/usd__coin");
 * ```
 */
export function buildCryptoAssetsStore({
  dispatch,
  api = cryptoAssetsApi,
}: BuildCryptoAssetsStoreConfig): CryptoAssetsStore {
  return {
    async findTokenById(id) {
      const { data, error } = await dispatch(api.endpoints.findTokenById.initiate({ id }));
      if (error) throw remapRtkQueryError(error);
      return data;
    },

    async findTokenByAddressInCurrency(address, currencyId, tokenIdentifier) {
      const { data, error } = await dispatch(
        api.endpoints.findTokenByAddressInCurrency.initiate({
          contract_address: address,
          network: currencyId,
          ...(tokenIdentifier === undefined ? {} : { token_identifier: tokenIdentifier }),
        }),
      );
      if (error) throw remapRtkQueryError(error);
      return data;
    },

    async getTokensSyncHash(currencyId) {
      const { data, error } = await dispatch(api.endpoints.getTokensSyncHash.initiate(currencyId));
      if (error) throw remapRtkQueryError(error);
      // A successful query always yields the commit hash; guard the type envelope
      // (string | undefined) instead of an unsafe cast so undefined can't escape.
      if (data === undefined) throw new NetworkDown();
      return data;
    },
  };
}

/**
 * Maps an RTK-Query error to the local error taxonomy.
 * See https://redux-toolkit.js.org/rtk-query/usage-with-typescript#type-safe-error-handling
 */
export function remapRtkQueryError(error: FetchBaseQueryError | SerializedError): Error {
  if ("status" in error) {
    const { status } = error;
    if (typeof status === "number") {
      if (status >= 400 && status < 500) return new LedgerAPI4xx();
      if (status >= 500 && status < 600) return new LedgerAPI5xx();
      return new NetworkDown();
    }
    if (status === "FETCH_ERROR") return new NetworkDown();
    // PARSING_ERROR / TIMEOUT_ERROR / CUSTOM_ERROR — surface the message.
    return new Error("error" in error ? error.error : String(status));
  }
  return new Error(error.message ?? "Unknown crypto-assets store error");
}
