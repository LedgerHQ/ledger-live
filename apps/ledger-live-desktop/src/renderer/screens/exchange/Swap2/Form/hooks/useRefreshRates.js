// @flow

import { useRef, useMemo, useEffect } from "react";
import type { SwapDataType } from "@ledgerhq/live-common/lib/exchange/swap/types";
import { getRefreshTime } from "~/renderer/screens/exchange/Swap2/utils/getRefreshTime";

const useRefreshRates = (swap: SwapDataType, { pause }: { pause: boolean }) => {
  const refreshInterval = useRef();

  const refreshTime = useMemo(() => getRefreshTime(swap.rates?.value), [swap.rates?.value]);

  useEffect(() => {
    refreshInterval.current && clearInterval(refreshInterval.current);
    refreshInterval.current = setInterval(() => {
      if (!pause) {
        swap.refetchRates();
      }
    }, refreshTime);
  }, [refreshTime, pause, swap, swap.rates?.value]);

  return refreshTime;
};

export default useRefreshRates;
