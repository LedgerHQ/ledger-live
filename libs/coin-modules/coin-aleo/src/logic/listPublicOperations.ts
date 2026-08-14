import { fetchAccountTransactionsFromHeight, fetchAccountTransitionPage } from "../network/utils";
import type { AleoCoinConfig, AleoPublicTransaction } from "../types";

// Prefer rows with an address (real transfers) over bare inner transitions of batching contracts.
// `transition_id` breaks remaining ties so the pick is stable across calls.
function pickTransactionRepresentatives(
  transactions: AleoPublicTransaction[],
): AleoPublicTransaction[] {
  const byTransactionId = new Map<string, AleoPublicTransaction>();

  for (const tx of transactions) {
    const transactionId = tx.transaction_id.trim();
    const current = byTransactionId.get(transactionId);

    if (!current || isBetterRepresentative(tx, current)) {
      byTransactionId.set(transactionId, tx);
    }
  }

  return [...byTransactionId.values()];
}

function isBetterRepresentative(
  candidate: AleoPublicTransaction,
  current: AleoPublicTransaction,
): boolean {
  const hasAddress = (tx: AleoPublicTransaction) =>
    Boolean(tx.sender_address || tx.recipient_address);

  if (hasAddress(candidate) !== hasAddress(current)) return hasAddress(candidate);

  return candidate.transition_id < current.transition_id;
}

// Drops the trailing transaction when incomplete: its representative may change as more transitions
// arrive on the next fetch, so only the caller's resumed transaction can be trusted whole.
export async function listPublicOperationsPage({
  config,
  address,
  minBlockHeight,
  startBlock,
  targetTransactions,
  order,
}: {
  config: AleoCoinConfig;
  address: string;
  minBlockHeight: number;
  startBlock?: number;
  targetTransactions: number;
  order?: "asc" | "desc";
}): Promise<{ transactions: AleoPublicTransaction[]; complete: boolean }> {
  const { transitions, complete } = await fetchAccountTransitionPage({
    config,
    address,
    minBlockHeight,
    targetTransactions,
    ...(typeof startBlock === "number" && { startBlock }),
    ...(order && { order }),
  });

  const transactions = pickTransactionRepresentatives(transitions);
  if (complete) return { transactions, complete: true };

  const trailingId = transitions.at(-1)?.transaction_id.trim();

  return {
    transactions: transactions.filter(tx => tx.transaction_id.trim() !== trailingId),
    complete: false,
  };
}

export async function listPublicOperations({
  config,
  address,
  minBlockHeight,
  cursor,
  limit,
  order,
}: {
  config: AleoCoinConfig;
  address: string;
  minBlockHeight: number;
  cursor?: string;
  limit?: number;
  order?: "asc" | "desc";
}): Promise<{
  transactions: AleoPublicTransaction[];
  nextCursor: string | null;
}> {
  // fetchAllPages: per-transition cursor can't page a per-transaction stream; normalisation must see every row of a tx.
  const { transactions, nextCursor } = await fetchAccountTransactionsFromHeight({
    config,
    address,
    fetchAllPages: true,
    minBlockHeight,
    ...(cursor && { cursor }),
    ...(limit && { limit }),
    ...(order && { order }),
  });

  return {
    transactions: pickTransactionRepresentatives(transactions),
    nextCursor,
  };
}
