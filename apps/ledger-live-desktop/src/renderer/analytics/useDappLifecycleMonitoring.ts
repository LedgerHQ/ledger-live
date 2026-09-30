import { useEffect } from "react";
import { useFeature } from "@features/platform-feature-flags";
import { startDappLifecycleMonitoring } from "@ledgerhq/transaction-observability";

type StakeRedirectParams = { accountId?: string; yieldId?: string };

/**
 * A stake CTA always carries the account or yield it redirects to, which is what separates it
 * from browsing the same app through Discover. The router hands those over through three
 * different channels depending on the entry point, so all three are read.
 */
export function hasStakeRedirectParams(
  routeState: StakeRedirectParams | null,
  search: string,
  internalParams: StakeRedirectParams,
): boolean {
  const searchParams = new URLSearchParams(search);
  return Boolean(
    routeState?.accountId ||
    routeState?.yieldId ||
    searchParams.get("accountId") ||
    searchParams.get("yieldId") ||
    internalParams.accountId ||
    internalParams.yieldId,
  );
}

export function useDappLifecycleMonitoring(
  manifestId: string | undefined,
  isStakeRedirect: boolean,
): void {
  const enabled = useFeature("earnTxLifecycleMonitoring")?.enabled ?? false;

  useEffect(
    () => startDappLifecycleMonitoring("desktop", manifestId, isStakeRedirect, enabled),
    [enabled, isStakeRedirect, manifestId],
  );
}
