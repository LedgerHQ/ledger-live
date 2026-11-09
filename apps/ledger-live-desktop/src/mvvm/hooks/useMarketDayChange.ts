import { useMemo } from "react";
import {
  heldMarketDayChange,
  NO_HELD_MARKET_DAY_CHANGE,
  type HeldCurrency,
  type HeldMarketDayChange,
} from "@features/platform-aggregated-assets";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { useGetMarketsByLedgerIdsQuery } from "@ledgerhq/live-common/market/state-manager/api";
import { useResolveMarketCounterCurrency } from "@ledgerhq/live-common/market/hooks/useResolveMarketCounterCurrency";
import { BASIC_REFETCH, REFETCH_TIME_ONE_MINUTE } from "@ledgerhq/live-common/market/utils/timers";
import { useSelector } from "LLD/hooks/redux";
import { flattenAccountsSelector } from "~/renderer/reducers/accounts";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";

const MARKET_DAY_CHANGE_REFRESH_MS = REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH;

function useHeldCurrencies(): readonly HeldCurrency[] {
  const accounts = useSelector(flattenAccountsSelector);
  const heldKey = useMemo(() => {
    const tickerById = new Map(
      accounts.map(account => {
        const { id, ticker } = getAccountCurrency(account);
        return [id, ticker];
      }),
    );
    return JSON.stringify([...tickerById].sort(([a], [b]) => a.localeCompare(b)));
  }, [accounts]);
  return useMemo(
    () => (JSON.parse(heldKey) as [string, string][]).map(([id, ticker]) => ({ id, ticker })),
    [heldKey],
  );
}

/** One `/v3/markets` request for every held currency, shared by all desktop 1D variations. */
export function useMarketDayChange(): HeldMarketDayChange {
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const heldCurrencies = useHeldCurrencies();
  const ledgerIds = useMemo(() => heldCurrencies.map(({ id }) => id), [heldCurrencies]);
  const { requestCounterCurrency, isResolutionLoading } = useResolveMarketCounterCurrency({
    counterCurrency: counterValueCurrency.ticker,
    isCryptoCountervalue: counterValueCurrency.type === "CryptoCurrency",
  });

  const { currentData } = useGetMarketsByLedgerIdsQuery(
    { ledgerIds, counterCurrency: requestCounterCurrency ?? "usd" },
    {
      skip: ledgerIds.length === 0 || isResolutionLoading || !requestCounterCurrency,
      pollingInterval: MARKET_DAY_CHANGE_REFRESH_MS,
      skipPollingIfUnfocused: true,
    },
  );

  return useMemo(
    () =>
      currentData ? heldMarketDayChange(currentData, heldCurrencies) : NO_HELD_MARKET_DAY_CHANGE,
    [currentData, heldCurrencies],
  );
}
