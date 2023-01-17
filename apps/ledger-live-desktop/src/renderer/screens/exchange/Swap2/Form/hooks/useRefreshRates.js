// @flow

import { useRef, useMemo, useEffect, useState } from "react";
import { getMinimumExpirationTime } from "@ledgerhq/live-common/exchange/swap/utils/index";
import type { SwapDataType } from "@ledgerhq/live-common/lib/exchange/swap/types";

const defaultRefreshTime = 30000;

const useRefreshRates = (swap: SwapDataType, { stop }: { stop: boolean }) => {
  const refreshInterval = useRef();
  const [firstRateId, setFirstRateId] = useState(null);

  useEffect(() => {
    const newFirstRateId = swap.rates?.value?.length ? swap.rates.value[0].rateId : null;
    setFirstRateId(newFirstRateId);
  }, [swap.rates?.value]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstRateId]);

  useEffect(() => {
    refreshInterval.current && clearInterval(refreshInterval.current);
    refreshInterval.current = setInterval(() => {
      if (!stop) {
        swap.refetchRates();
      }
    }, refreshTime);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stop, firstRateId, swap]);

  return refreshTime;
};

export default useRefreshRates;
