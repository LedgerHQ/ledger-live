// @flow

import { useRef, useMemo, useEffect } from "react";
import { getMinimumExpirationTime } from "@ledgerhq/live-common/exchange/swap/utils/index";
import type { SwapDataType } from "@ledgerhq/live-common/lib/exchange/swap/types";

const defaultRefreshTime = 30000;

const useRefreshRates = (swap: SwapDataType, { stop }: { stop: boolean }) => {
  const refreshInterval = useRef();

  const refreshTime = useMemo(() => {
    const minimumExpirationTime = swap.rates?.value
      ? getMinimumExpirationTime(swap.rates.value)
      : null;

    if (minimumExpirationTime) {
      const timeMs = minimumExpirationTime - Date.now();
      return timeMs > 0 ? timeMs : 0;
    } else {
      return defaultRefreshTime;
    }
  }, [swap.rates?.value]);

  useEffect(() => {
    refreshInterval.current && clearInterval(refreshInterval.current);
    refreshInterval.current = setInterval(() => {
      if (!stop) {
        swap.refetchRates();
      }
    }, refreshTime);
  }, [refreshTime, stop, swap, swap.rates.value]);

  return refreshTime;
};

export default useRefreshRates;
