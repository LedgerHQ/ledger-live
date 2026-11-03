import type { Account } from "@ledgerhq/types-live";
import type { BtcOperationExtra } from "./types";

/**
 * Build a list of UTXOs spent by the account's own broadcast but unconfirmed operations.
 * The explorer may not report mempool spends (or report them late), and a sync would then list
 * those UTXOs as spendable again: reusing one makes the node reject the transaction with
 * `txn-mempool-conflict`. The operation being replaced (RBF) keeps its inputs available.
 */
export function getExcludeUTXOsFromPendingOperations(
  account: Account,
  replaceTxId?: string,
): Array<{ hash: string; outputIndex: number }> {
  return account.pendingOperations
    .filter(op => op.hash !== replaceTxId)
    .flatMap(op => {
      const extra = op.extra as BtcOperationExtra | undefined;
      if (extra?.inputRefs?.length) {
        return extra.inputRefs.map(({ hash, outputIndex }) => ({ hash, outputIndex }));
      }
      return (extra?.inputs ?? []).flatMap(outpoint => {
        const separator = outpoint.lastIndexOf("-");
        const outputIndex = Number(outpoint.slice(separator + 1));
        return separator > 0 && Number.isInteger(outputIndex)
          ? [{ hash: outpoint.slice(0, separator), outputIndex }]
          : [];
      });
    });
}
