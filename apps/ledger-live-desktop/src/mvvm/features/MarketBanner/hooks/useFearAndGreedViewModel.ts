import {
  useGetFearAndGreedLatestQuery,
  FIFTEEN_MINUTES_IN_MS,
} from "@ledgerhq/live-common/cmc-client/state-manager/api";

export const useFearAndGreedViewModel = () => {
  const { data, isError, isLoading } = useGetFearAndGreedLatestQuery(undefined, {
    pollingInterval: FIFTEEN_MINUTES_IN_MS,
  });

  return { data, isError, isLoading };
};
