import { useParams } from "react-router";
import { useSelector } from "LLD/hooks/redux";
import { useGetCurrencyDataQuery } from "@ledgerhq/live-common/market/state-manager/api";
import { REFETCH_TIME_ONE_MINUTE, BASIC_REFETCH } from "@ledgerhq/live-common/market/utils/timers";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";
import { decodeRouteParam } from "../../../utils/decodeRouteParam";

/**
 * Shared RTK Query-backed currency data for Market Stats + Price Performance on Asset Detail.
 *
 * This hook centralizes the query arguments and derived view data used by both sections.
 * Multiple consumers may still call this hook, but RTK Query can reuse cached results for
 * identical query args instead of each consumer managing separate request logic manually.
 */
export function useMarketDataSectionCurrencyData() {
  const { "*": routeAssetId } = useParams<{ "*": string }>();
  const decodedAssetId = routeAssetId ? decodeRouteParam(routeAssetId) : undefined;
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const counterCurrency = counterValueCurrency.ticker.toLowerCase();
  const locale = useSelector(localeSelector);

  const { data, isLoading, isFetching } = useGetCurrencyDataQuery(
    { id: decodedAssetId, counterCurrency },
    {
      skip: !decodedAssetId,
      pollingInterval: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
    },
  );

  const showSkeleton = Boolean(decodedAssetId && (isLoading || isFetching) && !data);

  return {
    data,
    showSkeleton,
    decodedAssetId,
    counterCurrency,
    locale,
  };
}
