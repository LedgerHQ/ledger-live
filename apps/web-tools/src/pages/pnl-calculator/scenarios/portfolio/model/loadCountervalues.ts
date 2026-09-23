import type { Account } from "@ledgerhq/types-live";
import type { Currency } from "@domain/entity-currency";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import { initialState as countervaluesInitialState } from "@ledgerhq/live-countervalues/logic";
import { loadCountervalues, type RateSource } from "@domain/api-market-countervalues";
import { inferTrackingPairForAccounts } from "@ledgerhq/live-common/portfolio/trackingPairs";

/** Mirrors the bot/CLI settings (autofillGaps + market-cap batching). */
export async function loadPortfolioCountervalues(
  accounts: Account[],
  fiat: Currency,
  rates: RateSource,
): Promise<CounterValuesState> {
  const trackingPairs = inferTrackingPairForAccounts(accounts, fiat);
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
