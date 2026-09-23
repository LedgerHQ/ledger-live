import { useEffect } from "react";
import { useFeature } from "@features/platform-feature-flags";
import { startDappLifecycleMonitoring } from "@ledgerhq/transaction-observability";

export function useDappLifecycleMonitoring(
  manifestId: string | undefined,
  isStakeRedirect: boolean,
): void {
  const enabled = useFeature("earnTxLifecycleMonitoring")?.enabled ?? false;

  useEffect(
    () => startDappLifecycleMonitoring("mobile", manifestId, isStakeRedirect, enabled),
    [enabled, isStakeRedirect, manifestId],
  );
}
