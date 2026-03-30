import { useGetCounterValueIdsSortedByMarketCapQuery } from "./api";
import { defaultCounterValueIdsSortedByMarketCap } from "./schema";

export const useGetCounterValueIdsPolling = () => {
  const { data } = useGetCounterValueIdsSortedByMarketCapQuery(undefined, {
    pollingInterval: 30 * 60 * 1000,
    refetchOnReconnect: true,
  });
  return data ?? defaultCounterValueIdsSortedByMarketCap;
};
