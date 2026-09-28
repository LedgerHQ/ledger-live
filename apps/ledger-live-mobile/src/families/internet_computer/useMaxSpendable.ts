import type { Transaction } from "@ledgerhq/live-common/families/internet_computer/types";
import { useDebounce } from "@ledgerhq/live-common/hooks/useDebounce";
import type { AccountLike, ResolvedAccountBridge } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { useEffect, useState } from "react";

/**
 * The spendable figure shown beside an amount input, re-estimated as the amount changes.
 *
 * Debounced as the Send flow's amount step is: the transaction changes on every keystroke, and each
 * change would otherwise cost a bridge call. A rejected estimate is swallowed rather than surfaced:
 * the figure is a hint and the bridge validates the amount regardless. It leaves whatever last
 * succeeded on screen, which for ICP is near enough — the fee is constant, so the spendable balance
 * barely moves between estimates, and blanking a hint mid-keystroke reads worse than a stale one.
 *
 * Takes the bridge rather than resolving its own: `useAccountBridge` suspends on a promise, and the
 * staking amount screen already holds one for `useBridgeTransaction`.
 */
export function useMaxSpendable(
  bridge: ResolvedAccountBridge<Transaction>,
  account: AccountLike,
  transaction: Transaction | null | undefined,
): BigNumber | null {
  const [maxSpendable, setMaxSpendable] = useState<BigNumber | null>(null);
  const debouncedTransaction = useDebounce(transaction, 500);

  useEffect(() => {
    if (!debouncedTransaction) return;
    let cancelled = false;
    bridge
      .estimateMaxSpendable({ account, transaction: debouncedTransaction })
      .then(estimate => {
        if (!cancelled) setMaxSpendable(estimate);
      })
      .catch((error: Error) => console.warn("[ICP] max spendable estimate failed", error));
    return () => {
      cancelled = true;
    };
  }, [account, bridge, debouncedTransaction]);

  return maxSpendable;
}
