import { useRef, useEffect } from "react";
import { SwapDataType } from "@ledgerhq/live-common/exchange/swap/types";
import { DEFAULT_SWAP_RATES_INTERVAL_MS } from "@ledgerhq/live-common/exchange/swap/const/timeout";

const useRefreshRates = (
  swap: SwapDataType,
  {
    pause,
  }: {
    pause: boolean;
  },
) => {
  const refreshInterval = useRef<NodeJS.Timeout>();
  const refreshTime = DEFAULT_SWAP_RATES_INTERVAL_MS;

  useEffect(() => {
    clearTimeout(refreshInterval.current);
    refreshInterval.current = setTimeout(() => {
      if (!pause) {
        swap.refetchRates();
      }
    }, refreshTime);
    return () => {
      clearTimeout(refreshInterval.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pause, refreshTime, swap.rates?.value]);

  return refreshTime;
};

export default useRefreshRates;
