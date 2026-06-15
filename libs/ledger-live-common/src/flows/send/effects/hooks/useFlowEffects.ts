import { useEffect, useMemo, useRef, useState } from "react";
import isEqual from "lodash/isEqual";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Transaction } from "../../../../coin-modules/transaction-types";
import type { FlowEffect } from "../../../../bridge/descriptor/types";
import { sendFeatures } from "../../../../bridge/descriptor/send/features";
import { getAccountBridge } from "../../../../bridge/impl";

export type UseFlowEffectsParams = Readonly<{
  account: AccountLike | null;
  parentAccount: Account | null;
  transaction: Transaction | null;
  currency: CryptoOrTokenCurrency | null;
  /** Applies an effect patch by updating the flow transaction */
  updateTransaction: (updater: (tx: Transaction) => Transaction) => void;
}>;

export type UseFlowEffectsResult = Readonly<{
  /** True while at least one effect is resolving */
  loading: boolean;
  /** Last error thrown while resolving an effect or `null` */
  error: Error | null;
}>;

/**
 * Generic, family-agnostic runner for descriptor `FlowEffect`s.
 *
 * It resolves the effects declared by the current currency's descriptor, runs
 * them against the bridge-resolved transaction, and applies the returned opaque
 * patches via `bridge.updateTransaction`.
 *
 * Platform-neutral so the same runner serves LWD and LWM. When the descriptor
 * declares no effect, the runner is inert
 */
export function useFlowEffects({
  account,
  parentAccount,
  transaction,
  currency,
  updateTransaction,
}: UseFlowEffectsParams): UseFlowEffectsResult {
  const effects = useMemo<readonly FlowEffect[]>(
    () => sendFeatures.getAmountEffects(currency ?? undefined),
    [currency],
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Cancellation token: only the latest run is allowed to commit
  const requestIdRef = useRef(0);
  // Skip re-running when only the transaction reference changed (same content)
  const lastProcessedTxRef = useRef<Transaction | null>(null);
  // Keep the latest updater without retriggering the effect
  const updateTransactionRef = useRef(updateTransaction);
  updateTransactionRef.current = updateTransaction;

  useEffect(() => {
    if (!account || !transaction || effects.length === 0) {
      lastProcessedTxRef.current = null;
      return;
    }

    if (isEqual(lastProcessedTxRef.current, transaction)) {
      return;
    }

    requestIdRef.current += 1;
    const requestId = requestIdRef.current;
    const isStale = () => requestId !== requestIdRef.current;

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const bridge = await getAccountBridge(account, parentAccount ?? undefined);
        if (isStale()) return;

        for (const effect of effects) {
          const patch = await effect.run({
            account,
            parentAccount: parentAccount ?? null,
            transaction,
            bridge,
          });
          if (isStale()) return;
          if (!patch) continue;

          updateTransactionRef.current(currentTx => {
            const next = bridge.updateTransaction(currentTx, patch as Partial<Transaction>);
            // Preserve reference when unchanged to avoid an update loop
            return isEqual(next, currentTx) ? currentTx : next;
          });
        }

        lastProcessedTxRef.current = transaction;
      } catch (e) {
        if (!isStale()) {
          setError(e instanceof Error ? e : new Error(String(e)));
        }
      } finally {
        if (!isStale()) {
          setLoading(false);
        }
      }
    })();

    return () => {
      // Invalidate this run so a new takes over
      requestIdRef.current += 1;
    };
  }, [account, parentAccount, transaction, effects]);

  return { loading, error };
}
