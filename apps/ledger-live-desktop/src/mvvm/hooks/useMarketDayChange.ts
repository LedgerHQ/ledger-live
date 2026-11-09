import { useMemo } from "react";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import {
  pairMarketsWithRequestedLedgerIds,
  useGetMarketsByLedgerIdsQuery,
} from "@ledgerhq/live-common/market/state-manager/api";
import { BASIC_REFETCH, REFETCH_TIME_ONE_MINUTE } from "@ledgerhq/live-common/market/utils/timers";
import type { MarketItemResponse } from "@ledgerhq/live-common/market/utils/types";
import { useSelector } from "LLD/hooks/redux";
import { flattenAccountsSelector } from "~/renderer/reducers/accounts";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";

const MARKET_DAY_CHANGE_REFRESH_MS = REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH;
const NO_MARKET_DAY_CHANGE: ReadonlyMap<string, number> = new Map();

function dayChangeOf(market: MarketItemResponse): number | undefined {
  const change = market.priceChangePercentage24h;
  return typeof change === "number" && Number.isFinite(change) ? change : undefined;
}

export function marketDayChangeByLedgerId(
  markets: readonly MarketItemResponse[],
  ledgerIds: readonly string[],
): ReadonlyMap<string, number> {
  const changeByLedgerId = new Map<string, number>();
  for (const { ledgerId, market } of pairMarketsWithRequestedLedgerIds(
    [...markets],
    [...ledgerIds],
  )) {
    const change = dayChangeOf(market);
    if (change !== undefined) changeByLedgerId.set(ledgerId, change);
  }
  return changeByLedgerId;
}

export function marketDayChangeByMarketId(
  markets: readonly MarketItemResponse[],
): ReadonlyMap<string, number> {
  const changeByMarketId = new Map<string, number>();
  for (const market of markets) {
    const change = dayChangeOf(market);
    if (change !== undefined) changeByMarketId.set(market.id, change);
  }
  return changeByMarketId;
}

export function countervalueChangeFromDayPercent(
  currentCountervalue: number | null | undefined,
  percentPoints: number,
): { readonly percentage: number; readonly value: number } | undefined {
  if (
    currentCountervalue == null ||
    !Number.isFinite(currentCountervalue) ||
    !Number.isFinite(percentPoints)
  ) {
    return undefined;
  }

  const denominator = 1 + percentPoints / 100;
  if (denominator === 0) return undefined;

  const value = currentCountervalue - currentCountervalue / denominator;
  if (!Number.isFinite(value)) return undefined;

  return { percentage: percentPoints / 100, value };
}

function useHeldMarkets(): Readonly<{
  markets: readonly MarketItemResponse[] | undefined;
  ledgerIds: readonly string[];
}> {
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const accounts = useSelector(flattenAccountsSelector);
  const idsKey = useMemo(
    () =>
      [...new Set(accounts.map(account => getAccountCurrency(account).id))]
        .sort((a, b) => a.localeCompare(b))
        .join(","),
    [accounts],
  );
  const ledgerIds = useMemo(() => (idsKey ? idsKey.split(",") : []), [idsKey]);

  const { currentData } = useGetMarketsByLedgerIdsQuery(
    { ledgerIds, counterCurrency: counterValueCurrency.ticker },
    {
      skip: ledgerIds.length === 0,
      pollingInterval: MARKET_DAY_CHANGE_REFRESH_MS,
      skipPollingIfUnfocused: true,
    },
  );

  return { markets: currentData, ledgerIds };
}

const NO_HELD_MARKET_DAY_CHANGE: Readonly<{
  byLedgerId: ReadonlyMap<string, number>;
  byMarketId: ReadonlyMap<string, number>;
}> = { byLedgerId: NO_MARKET_DAY_CHANGE, byMarketId: NO_MARKET_DAY_CHANGE };

export function useMarketDayChange(): Readonly<{
  byLedgerId: ReadonlyMap<string, number>;
  byMarketId: ReadonlyMap<string, number>;
}> {
  const { markets, ledgerIds } = useHeldMarkets();
  return useMemo(
    () =>
      markets
        ? {
            byLedgerId: marketDayChangeByLedgerId(markets, ledgerIds),
            byMarketId: marketDayChangeByMarketId(markets),
          }
        : NO_HELD_MARKET_DAY_CHANGE,
    [markets, ledgerIds],
  );
}
