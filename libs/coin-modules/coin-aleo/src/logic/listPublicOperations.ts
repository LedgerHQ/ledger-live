import { fetchAccountTransactionsFromHeight } from "../network/utils";
import type { AleoCoinConfig, AleoPublicTransaction } from "../types";

/**
 * The explorer pages per transition, so a multi-transition transaction arrives as several rows
 * sharing one transaction_id. Only one can represent the transaction, and the choice must be
 * deterministic across calls or a replayed page would rewrite rows it already emitted.
 *
 * Rows carrying an address are preferred over the bare inner transitions of a batching contract
 * (testnet: at1lqugdt847uwnfem2xhzwq6ewrnd6ysjv2gumvglytskutxj3kcpsmc3rrf), and `transition_id`
 * breaks the remaining ties.
 */
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

/** The public half of the Aleo history, normalised to one row per transaction. */
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
}): Promise<{ transactions: AleoPublicTransaction[]; nextCursor: string | null }> {
  const { transactions, nextCursor } = await fetchAccountTransactionsFromHeight({
    config,
    address,
    // Always exhaustive: a per-transition cursor cannot page a per-transaction stream, so the
    // normalisation has to see every row of a transaction before it picks one.
    fetchAllPages: true,
    minBlockHeight,
    ...(cursor && { cursor }),
    ...(limit && { limit }),
    ...(order && { order }),
  });

  return { transactions: pickTransactionRepresentatives(transactions), nextCursor };
}
