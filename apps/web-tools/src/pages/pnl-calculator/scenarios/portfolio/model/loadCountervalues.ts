import type { Account } from "@ledgerhq/types-live";
import type { Currency } from "@ledgerhq/types-cryptoassets";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import {
  initialState as countervaluesInitialState,
  inferTrackingPairForAccounts,
  loadCountervalues,
} from "@ledgerhq/live-countervalues/logic";

/** Mirrors the bot/CLI settings (autofillGaps + market-cap batching). */
export async function loadPortfolioCountervalues(
  accounts: Account[],
  fiat: Currency,
): Promise<CounterValuesState> {
  const trackingPairs = inferTrackingPairForAccounts(accounts, fiat);
  return loadCountervalues(countervaluesInitialState, {
    trackingPairs,
    autofillGaps: true,
    refreshRate: 60000,
    marketCapBatchingAfterRank: 20,
  });
}
