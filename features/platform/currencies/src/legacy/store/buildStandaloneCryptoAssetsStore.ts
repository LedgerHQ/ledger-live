import { configureStore } from "@reduxjs/toolkit";
import { calApiExtra, cryptoAssetsApi, type CalApiExtra } from "@domain/api-currency-token";
import { buildCryptoAssetsStore } from "./buildCryptoAssetsStore";
import type { CryptoAssetsStore } from "./port";

/**
 * Builds a {@link CryptoAssetsStore} backed by its **own**, internally-configured
 * Redux store — for runtimes that do not own one: CLI scripts, monitoring jobs,
 * bots, and integration-test setup.
 *
 * It configures a minimal store (the CAL api's reducer + middleware, with the CAL
 * configuration installed as the thunk `extraArgument`) and delegates to
 * {@link buildCryptoAssetsStore}. Because it owns the store, the caller supplies no
 * `dispatch` — only the CAL configuration. That configuration cannot be read here
 * (this package must not depend on the runtime environment); the composition root
 * resolves it and passes the resolved values in.
 *
 * For code running inside an application that already owns a store, use
 * {@link buildCryptoAssetsStore} instead — creating a second store here would
 * duplicate the CAL cache.
 *
 * @param extra
 * Resolved CAL configuration: `calServiceUrl`, `ledgerClientVersion`, and an optional
 * `logger`. The composition root typically reads these from its environment and passes
 * the resolved values (this package never reads them).
 *
 * @returns
 * A {@link CryptoAssetsStore} owning a private CAL cache — async `findTokenById`,
 * `findTokenByAddressInCurrency`, and `getTokensSyncHash`.
 *
 * @example
 * ```ts
 * // Standalone runtime (no application store):
 * const store = buildStandaloneCryptoAssetsStore({
 *   calServiceUrl: readEnv("CAL_SERVICE_URL"),
 *   ledgerClientVersion: readEnv("LEDGER_CLIENT_VERSION"),
 * });
 * const hash = await store.getTokensSyncHash("ethereum");
 * ```
 */
export function buildStandaloneCryptoAssetsStore(extra: CalApiExtra): CryptoAssetsStore {
  const store = configureStore({
    reducer: { [cryptoAssetsApi.reducerPath]: cryptoAssetsApi.reducer },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: false,
        thunk: { extraArgument: calApiExtra(extra) },
      }).concat(cryptoAssetsApi.middleware),
  });

  return buildCryptoAssetsStore({ dispatch: store.dispatch });
}
