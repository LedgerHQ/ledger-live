import { useEffect, useState } from "react";
import { MarketPerformersParams } from "../utils/types";
import { useGetMarketPerformersQuery } from "../state-manager/api";

const NORMAL_REFETCH_INTERVAL = 3 * 60 * 1000;
const ERROR_REFETCH_INTERVAL = 30 * 1000;

export const useMarketPerformers = ({
  counterCurrency,
  range,
  limit = 5,
  top = 50,
  sort,
  supported,
}: Omit<MarketPerformersParams, "refreshRate">) => {
  const [pollingInterval, setPollingInterval] = useState(NORMAL_REFETCH_INTERVAL);

  const result = useGetMarketPerformersQuery(
    { counterCurrency, range, limit, top, sort, supported },
    { pollingInterval },
  );

  useEffect(() => {
    setPollingInterval(result.isError ? ERROR_REFETCH_INTERVAL : NORMAL_REFETCH_INTERVAL);
  }, [result.isError]);

  return result;
};
