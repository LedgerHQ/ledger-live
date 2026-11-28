import { useEffect } from "react";
import { useFeature } from "@features/platform-feature-flags";
import { startEarnAppLifecycleMonitoring } from "@ledgerhq/transaction-observability";

/** Closes a pending Earn live app sign attempt as abandoned when the webview showing it goes away. */
export function useEarnAppLifecycleMonitoring(manifestId: string | undefined): void {
  const enabled = useFeature("earnTxLifecycleMonitoring")?.enabled ?? false;

  useEffect(
    () => startEarnAppLifecycleMonitoring("mobile", manifestId, enabled),
    [enabled, manifestId],
  );
}
