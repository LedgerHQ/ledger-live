import { log } from "@ledgerhq/logs";
import {
  defaultCounterValueIdsSortedByMarketCap,
  useGetCounterValueIdsSortedByMarketCapQuery,
} from "@domain/api-market-countervalues";
import { useEffect } from "react";

export const useGetCounterValueIdsPolling = () => {
  const { data, error } = useGetCounterValueIdsSortedByMarketCapQuery(undefined, {
    pollingInterval: 30 * 60 * 1000,
    refetchOnReconnect: true,
  });

  // The api reports a rejected response as a typed error rather than logging it, since it injects
  // into a shared service and holds no logging dependency. Reporting it is the consumer's job.
  useEffect(() => {
    if (error) log("countervaluesApi", `getCounterValueIdsSortedByMarketCap failed`, { error });
  }, [error]);

  return data ?? defaultCounterValueIdsSortedByMarketCap;
};
