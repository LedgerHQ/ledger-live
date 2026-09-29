import { buildCryptoAssetsStore } from "@features/platform-currencies";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { setRateLookup as setAssetAggregationRateLookup } from "@ledgerhq/asset-aggregation/rateLookup";
import { setRateLookup as setWalletAnalyticsRateLookup } from "@ledgerhq/wallet-analytics";
import { setRateLookup as setWalletPnlRateLookup } from "@ledgerhq/wallet-pnl";
import { calculate } from "@ledgerhq/live-countervalues/logic";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import {
  historyKey,
  inferCurrencyAPIID,
  type CounterValuesState as MarketCounterValuesState,
} from "@domain/entity-market-countervalues";
import type { StoreType } from "~/state-manager/configureStore";

export function setupCryptoAssetsStore(store: StoreType) {
  const cryptoAssetsStore = buildCryptoAssetsStore({ dispatch: store.dispatch });
  setCryptoAssetsStore(cryptoAssetsStore);
}

/**
 * Fill the countervalues interfaces that `@ledgerhq/asset-aggregation`,
 * `@ledgerhq/wallet-analytics` and `@ledgerhq/wallet-pnl` declare. All three treat the
 * state as opaque, so the casts back to a concrete state belong here, at the
 * composition root.
 */
export function setupRateLookups(): void {
  const rateLookup = {
    calculate: (snapshot: unknown, query: Parameters<typeof calculate>[1]) =>
      calculate(snapshot as CounterValuesState, query),
  };

  setAssetAggregationRateLookup(rateLookup);
  setWalletAnalyticsRateLookup(rateLookup);
  setWalletPnlRateLookup({
    ...rateLookup,
    historyKey: (snapshot, from, to, lastOpDate) =>
      historyKey(snapshot as MarketCounterValuesState, from, to, lastOpDate),
    currencyApiId: inferCurrencyAPIID,
  });
}
