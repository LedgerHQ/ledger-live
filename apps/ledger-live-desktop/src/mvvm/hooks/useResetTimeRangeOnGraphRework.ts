import { useEffect, useRef } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { setSelectedTimeRange } from "~/renderer/actions/settings";

/**
 * Wallet 4.0 graph rework: reset the selected time range to "day" once per launch when the
 * rework is enabled. Temporary until wallet 4.0 is 100% enabled.
 */
export function useResetTimeRangeOnGraphRework(): void {
  const dispatch = useDispatch();
  const { shouldDisplayGraphRework } = useWalletFeaturesConfig("desktop");
  const hasReset = useRef(false);

  useEffect(() => {
    if (shouldDisplayGraphRework && !hasReset.current) {
      hasReset.current = true;
      dispatch(setSelectedTimeRange("day"));
    }
  }, [shouldDisplayGraphRework, dispatch]);
}
