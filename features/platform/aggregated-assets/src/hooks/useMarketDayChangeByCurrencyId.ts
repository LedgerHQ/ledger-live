import { useMemo } from "react";
import {
  useGetChunkedAssetsDataQuery,
  type GetAssetsDataParams,
} from "@domain/api-aggregated-assets";
import { marketDayChangeByCurrencyId } from "../marketDayChange";

type UseMarketDayChangeByCurrencyIdParams = Omit<GetAssetsDataParams, "currencyIds"> &
  Readonly<{
    currencyIds: readonly string[];
    skip?: boolean;
    pollingInterval?: number;
    skipPollingIfUnfocused?: boolean;
  }>;

/** 24h price change in percent points for each given currency, whatever page of the catalog it is on. */
export function useMarketDayChangeByCurrencyId({
  currencyIds,
  skip,
  pollingInterval,
  skipPollingIfUnfocused,
  ...params
}: UseMarketDayChangeByCurrencyIdParams): ReadonlyMap<string, number> {
  const sortedIds = useMemo(
    () => [...new Set(currencyIds)].sort((a, b) => a.localeCompare(b)),
    [currencyIds],
  );

  const { data } = useGetChunkedAssetsDataQuery(
    { ...params, currencyIds: sortedIds },
    {
      skip: skip || sortedIds.length === 0,
      pollingInterval,
      skipPollingIfUnfocused,
      refetchOnMountOrArgChange: true,
    },
  );

  return useMemo(() => marketDayChangeByCurrencyId(data), [data]);
}
