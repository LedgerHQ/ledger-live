import { useEffect, useState } from "react";
import type { ZcashAccountBridge } from "@ledgerhq/coin-zcash/bridge/index";
import type { ZcashAccount } from "@ledgerhq/coin-zcash/types";
import type { AccountLike } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/live-common/account/helpers";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";

const DEBOUNCE_MS = 300;

/**
 * Block height a scan starting at `birthday` begins from, or null while it is
 * unknown (disabled, being looked up, or the lookup failed -- which only hides
 * the height and never blocks the flow).
 *
 * The bridge is resolved inside the effect rather than with `useAccountBridge`,
 * so the step never suspends on an informative lookup.
 */
export function useBirthdayBlockHeight(
  account: AccountLike | null | undefined,
  birthday: string,
  enabled: boolean,
): number | null {
  const [result, setResult] = useState<{ birthday: string; height: number } | null>(null);

  useEffect(() => {
    if (!enabled || !account) return;

    let stale = false;
    const timer = setTimeout(async () => {
      try {
        const bridge = (await getAccountBridge(
          getMainAccount(account),
        )) as unknown as ZcashAccountBridge;
        const height = await bridge.findBlockHeightAtDate(
          getMainAccount(account) as unknown as ZcashAccount,
          birthday,
        );
        if (!stale) setResult({ birthday, height });
      } catch {
        if (!stale) setResult(null);
      }
    }, DEBOUNCE_MS);

    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [account, birthday, enabled]);

  // A height only answers the date it was looked up for.
  return enabled && result?.birthday === birthday ? result.height : null;
}
