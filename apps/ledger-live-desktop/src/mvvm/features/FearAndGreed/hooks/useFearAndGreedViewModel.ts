import { useGetFearAndGreedLatestQuery, FIFTEEN_MINUTES_IN_MS } from "@domain/api-market-sentiment";

export const useFearAndGreedViewModel = () => {
  const { data, isError, isLoading } = useGetFearAndGreedLatestQuery(undefined, {
    pollingInterval: FIFTEEN_MINUTES_IN_MS,
  });

  return { data, isError, isLoading };
};
