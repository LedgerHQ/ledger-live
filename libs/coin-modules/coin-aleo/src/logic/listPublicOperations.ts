import { fetchAccountTransitionPage } from "../network/utils";
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

// Normalises the explorer's per-transition rows to tx granularity. Only the coin-module surface uses
// this — `bridge/listOperations.ts` consumes raw rows, so its operation ids stay as they were.
export async function listPublicOperationsPage({
  config,
  address,
  fromBlock,
  toBlock,
  minTransactions,
  order,
}: {
  config: AleoCoinConfig;
  address: string;
  fromBlock: number;
  toBlock: number;
  minTransactions: number;
  order?: "asc" | "desc";
}): Promise<{ transactions: AleoPublicTransaction[]; nextBlock: number | null }> {
  const { transitions, nextBlock } = await fetchAccountTransitionPage({
    config,
    address,
    fromBlock,
    toBlock,
    minTransactions,
    ...(order && { order }),
  });

  return { transactions: pickTransactionRepresentatives(transitions), nextBlock };
}
