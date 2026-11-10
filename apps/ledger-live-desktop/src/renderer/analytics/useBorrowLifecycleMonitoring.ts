import { useEffect } from "react";
import { useFeature } from "@features/platform-feature-flags";
import { startBorrowLifecycleMonitoring } from "@ledgerhq/transaction-observability";

/** Closes a pending Borrow sign attempt as abandoned when the Borrow webview goes away. */
export function useBorrowLifecycleMonitoring(manifestId: string | undefined): void {
  const enabled = useFeature("borrowTxLifecycleMonitoring")?.enabled ?? false;

  useEffect(
    () => startBorrowLifecycleMonitoring("desktop", manifestId, enabled),
    [enabled, manifestId],
  );
}
