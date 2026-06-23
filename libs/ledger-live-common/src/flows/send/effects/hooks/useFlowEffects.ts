import { useEffect, useMemo, useRef, useState } from "react";
import isEqual from "lodash/isEqual";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Transaction } from "../../../../coin-modules/transaction-types";
import type { FlowEffect, TransactionPatch } from "../../../../bridge/descriptor/types";
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

type ProcessedRun = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  effects: readonly FlowEffect[];
}>;

function isSameProcessedRun(processedRun: ProcessedRun | null, nextRun: ProcessedRun): boolean {
  return (
    processedRun !== null &&
    processedRun.account === nextRun.account &&
    processedRun.parentAccount === nextRun.parentAccount &&
    processedRun.effects === nextRun.effects &&
    isEqual(processedRun.transaction, nextRun.transaction)
  );
}

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
  // Skip re-running when only the transaction reference changed (same content and context)
  const lastProcessedRunRef = useRef<ProcessedRun | null>(null);
  // Keep the latest updater without retriggering the effect
  const updateTransactionRef = useRef(updateTransaction);
  updateTransactionRef.current = updateTransaction;

  useEffect(() => {
    if (!account || !transaction || effects.length === 0) {
      lastProcessedRunRef.current = null;
      setLoading(false);
      setError(null);
      return;
    }

    const currentRun = { account, parentAccount, transaction, effects };

    if (isSameProcessedRun(lastProcessedRunRef.current, currentRun)) {
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

        const patches: TransactionPatch[] = [];
        let stagedTransaction = transaction;

        for (const effect of effects) {
          if (isStale()) return;

          const patch = await effect.run({
            account,
            parentAccount: parentAccount ?? null,
            transaction: stagedTransaction,
            bridge,
          });
          if (isStale()) return;
          if (!patch) continue;

          patches.push(patch);
          const next = bridge.updateTransaction(stagedTransaction, patch as Partial<Transaction>);
          stagedTransaction = isEqual(next, stagedTransaction) ? stagedTransaction : next;
        }

        if (isStale()) return;

        if (patches.length > 0) {
          updateTransactionRef.current(currentTx => {
            let next = currentTx;
            for (const patch of patches) {
              const updated = bridge.updateTransaction(next, patch as Partial<Transaction>);
              next = isEqual(updated, next) ? next : updated;
            }
            // Preserve reference when unchanged to avoid an update loop
            return isEqual(next, currentTx) ? currentTx : next;
          });
        }

        lastProcessedRunRef.current = { ...currentRun, transaction: stagedTransaction };
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
