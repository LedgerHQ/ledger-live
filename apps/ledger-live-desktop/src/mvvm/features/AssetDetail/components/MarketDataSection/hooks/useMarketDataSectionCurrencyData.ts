import { useSelector } from "LLD/hooks/redux";
import { useGetCurrencyDataQuery } from "@ledgerhq/live-common/market/state-manager/api";
import { REFETCH_TIME_ONE_MINUTE, BASIC_REFETCH } from "@ledgerhq/live-common/market/utils/timers";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";

export type MarketDataSectionCurrencyData = Readonly<{
  data: ReturnType<typeof useGetCurrencyDataQuery>["data"];
  showSkeleton: boolean;
  counterCurrency: string;
  locale: string;
}>;

/**
 * RTK Query-backed currency data for Market Stats + Price Performance.
 * Call once from `MarketDataSection` and pass the result through `MarketDataSectionCurrencyProvider`
 * so child view models share a single subscription for identical args.
 */
export function useMarketDataSectionCurrencyData(
  currencyQueryId: string | undefined,
): MarketDataSectionCurrencyData {
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const counterCurrency = counterValueCurrency.ticker.toLowerCase();
  const locale = useSelector(localeSelector);

  const { data, isLoading, isFetching } = useGetCurrencyDataQuery(
    { id: currencyQueryId ?? "", counterCurrency },
    {
      skip: !currencyQueryId,
      pollingInterval: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
    },
  );

  const showSkeleton = Boolean(currencyQueryId && (isLoading || isFetching) && !data);

  return {
    data,
    showSkeleton,
    counterCurrency,
    locale,
  };
}
