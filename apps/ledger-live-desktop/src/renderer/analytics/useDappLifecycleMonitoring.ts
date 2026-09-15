import { useEffect } from "react";
import { getFeature } from "@ledgerhq/live-common/firebase/featureFlags";
import {
  abandonPendingDappTxLifecycle,
  clearPendingDappTxLifecycle,
  startDappTxLifecycle,
} from "@ledgerhq/transaction-observability";

export function useDappLifecycleMonitoring(manifestId: string | undefined): void {
  useEffect(() => {
    if (getFeature({ key: "earnTxLifecycleMonitoring" })?.enabled) {
      startDappTxLifecycle("desktop", manifestId);
    }

    return () => {
      if (getFeature({ key: "earnTxLifecycleMonitoring" })?.enabled) {
        abandonPendingDappTxLifecycle("desktop");
      } else {
        clearPendingDappTxLifecycle("desktop");
      }
    };
  }, [manifestId]);
}
