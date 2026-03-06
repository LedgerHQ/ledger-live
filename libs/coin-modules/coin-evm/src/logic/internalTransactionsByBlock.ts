import type { BlockTransaction } from "@ledgerhq/coin-framework/api/index";
import { internalTxsToOperationsByHash } from "../adapters/etherscan";
import { EtherscanInternalTransaction } from "../types";

/**
 * Merges internal transaction operations into block transactions by matching tx hash.
 */
export function mergeInternalTransactions(
  transactions: BlockTransaction[],
  internalTxs: EtherscanInternalTransaction[],
): BlockTransaction[] {
  if (internalTxs.length === 0) return transactions;

  const opsByHash = internalTxsToOperationsByHash(internalTxs);
  if (opsByHash.size === 0) return transactions;

  return transactions.map(tx => {
    const extraOps = opsByHash.get(tx.hash);
    if (!extraOps || extraOps.length === 0) return tx;
    return {
      ...tx,
      operations: [...tx.operations, ...extraOps],
    };
  });
}
