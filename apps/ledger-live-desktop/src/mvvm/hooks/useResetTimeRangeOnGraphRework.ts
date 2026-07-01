import { useEffect, useRef } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { setSelectedTimeRange } from "~/renderer/actions/settings";

/**
 * Reset the selected time range to "day" once per launch when the
 * rework is enabled.
 */
export function useResetTimeRangeOnGraphRework(): void {
  const dispatch = useDispatch();
  const hasReset = useRef(false);

  useEffect(() => {
    if (!hasReset.current) {
      hasReset.current = true;
      dispatch(setSelectedTimeRange("day"));
    }
  }, [dispatch]);
}
