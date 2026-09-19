import { useEffect } from "react";
import { useFeature } from "@features/platform-feature-flags";
import {
  abandonPendingDappTxLifecycle,
  clearPendingDappTxLifecycle,
  startDappTxLifecycle,
} from "@ledgerhq/transaction-observability";
import { isEarnTxLifecycleMonitoringEnabled } from "./earnTxLifecycleFlag";

export function useDappLifecycleMonitoring(
  manifestId: string | undefined,
  isStakeRedirect: boolean,
): void {
  const enabled = useFeature("earnTxLifecycleMonitoring")?.enabled ?? false;

  useEffect(() => {
    if (!manifestId || !isStakeRedirect) return;

    if (!enabled) {
      clearPendingDappTxLifecycle("desktop", manifestId);
      return;
    }

    startDappTxLifecycle("desktop", manifestId);
    return () => {
      if (isEarnTxLifecycleMonitoringEnabled()) {
        abandonPendingDappTxLifecycle("desktop", manifestId);
      }
    };
  }, [enabled, isStakeRedirect, manifestId]);
}
