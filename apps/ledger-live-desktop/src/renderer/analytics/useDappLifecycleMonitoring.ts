import { useEffect, useRef } from "react";
import { useFeature } from "@features/platform-feature-flags";
import {
  abandonPendingDappTxLifecycle,
  clearPendingTxLifecycle,
  startDappTxLifecycle,
} from "@ledgerhq/transaction-observability";

export function useDappLifecycleMonitoring(manifestId: string | undefined): void {
  const enabled = useFeature("earnTxLifecycleMonitoring")?.enabled ?? false;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => {
    if (!enabled) {
      clearPendingTxLifecycle("desktop");
      return;
    }

    startDappTxLifecycle("desktop", manifestId);
    return () => {
      if (enabledRef.current) {
        abandonPendingDappTxLifecycle("desktop");
      }
    };
  }, [enabled, manifestId]);
}
