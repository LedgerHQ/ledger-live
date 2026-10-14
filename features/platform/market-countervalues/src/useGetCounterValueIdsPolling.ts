import {
  defaultCounterValueIdsSortedByMarketCap,
  useGetCounterValueIdsSortedByMarketCapQuery,
} from "@domain/api-market-countervalues";
import { useEffect } from "react";
import { log } from "./internals/logger";

export const useGetCounterValueIdsPolling = () => {
  const { data, error } = useGetCounterValueIdsSortedByMarketCapQuery(undefined, {
    pollingInterval: 30 * 60 * 1000,
    refetchOnReconnect: true,
  });

  useEffect(() => {
    if (error) log("countervaluesApi", `getCounterValueIdsSortedByMarketCap failed`, { error });
  }, [error]);

  return data ?? defaultCounterValueIdsSortedByMarketCap;
};
