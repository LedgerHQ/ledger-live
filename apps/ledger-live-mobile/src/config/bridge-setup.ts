import { buildCryptoAssetsStore } from "@features/platform-currencies";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { setRateLookup as setAssetAggregationRateLookup } from "@ledgerhq/asset-aggregation/rateLookup";
import { setRateLookup as setWalletAnalyticsRateLookup } from "@ledgerhq/wallet-analytics";
import { calculate } from "@ledgerhq/live-countervalues/logic";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import type { StoreType } from "~/state-manager/configureStore";

export function setupCryptoAssetsStore(store: StoreType) {
  const cryptoAssetsStore = buildCryptoAssetsStore({ dispatch: store.dispatch });
  setCryptoAssetsStore(cryptoAssetsStore);
}

/**
 * Fill the countervalues interfaces that `@ledgerhq/asset-aggregation` and
 * `@ledgerhq/wallet-analytics` declare. Both treat the state as opaque, so the
 * single cast back to `CounterValuesState` belongs here, at the composition root.
 */
export function setupRateLookups(): void {
  const rateLookup = {
    calculate: (snapshot: unknown, query: Parameters<typeof calculate>[1]) =>
      calculate(snapshot as CounterValuesState, query),
  };

  setAssetAggregationRateLookup(rateLookup);
  setWalletAnalyticsRateLookup(rateLookup);
}
