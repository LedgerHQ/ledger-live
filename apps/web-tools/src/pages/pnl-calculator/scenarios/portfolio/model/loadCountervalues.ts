import type { Account } from "@ledgerhq/types-live";
import type { Currency } from "@domain/entity-currency";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import { initialState as countervaluesInitialState } from "@ledgerhq/live-countervalues/logic";
import {
  createRateSource,
  loadCountervalues,
  marketCountervaluesApi,
} from "@domain/api-market-countervalues";
import { inferTrackingPairForAccounts } from "@ledgerhq/live-common/portfolio/trackingPairs";
import { store } from "~/store";

/** Mirrors the bot/CLI settings (autofillGaps + market-cap batching). */
export async function loadPortfolioCountervalues(
  accounts: Account[],
  fiat: Currency,
): Promise<CounterValuesState> {
  const trackingPairs = inferTrackingPairForAccounts(accounts, fiat);
  // Built here rather than taken from the countervalues bridge: this runs in a file-drop callback,
  // outside any React tree, so it cannot call hooks.
  const rates = createRateSource({
    fetchHistoricalWindow: args =>
      store.dispatch(
        marketCountervaluesApi.endpoints.getHistoricalRates.initiate(args, { forceRefetch: true }),
      ),
    fetchSpotBatch: args =>
      store.dispatch(
        marketCountervaluesApi.endpoints.getSpotRates.initiate(args, { forceRefetch: true }),
      ),
  });
  return loadCountervalues(
    countervaluesInitialState,
    {
      trackingPairs,
      autofillGaps: true,
      refreshRate: 60000,
      marketCapBatchingAfterRank: 20,
    },
    { rates },
  );
}
