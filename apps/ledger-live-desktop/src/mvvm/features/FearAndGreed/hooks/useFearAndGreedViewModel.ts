import { useGetFearAndGreedLatestQuery } from "@domain/api-market-sentiment";
import { FEAR_AND_GREED_REFRESH_INTERVAL_MS } from "../constants";

export const useFearAndGreedViewModel = () => {
  const { data, isError, isLoading } = useGetFearAndGreedLatestQuery(undefined, {
    pollingInterval: FEAR_AND_GREED_REFRESH_INTERVAL_MS,
  });

  return { data, isError, isLoading };
};
