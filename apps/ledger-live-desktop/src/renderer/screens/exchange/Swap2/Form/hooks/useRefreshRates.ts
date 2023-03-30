import { useRef, useMemo, useEffect } from "react";
import { SwapDataType } from "@ledgerhq/live-common/lib/exchange/swap/types";
import { getRefreshTime } from "~/renderer/screens/exchange/Swap2/utils/getRefreshTime";
const useRefreshRates = (
  swap: SwapDataType,
  {
    pause,
  }: {
    pause: boolean;
  },
) => {
  const refreshInterval = useRef();
  const refreshTime = useMemo(() => getRefreshTime(swap.rates?.value), [swap.rates?.value]);
  useEffect(() => {
    clearTimeout(refreshInterval.current);
    refreshInterval.current = setTimeout(() => {
      if (!pause) {
        swap.refetchRates();
      }
    }, [refreshTime]);
    return () => {
      clearTimeout(useRefreshRates.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pause, refreshTime, swap.rates?.value]);
  return refreshTime;
};
export default useRefreshRates;
