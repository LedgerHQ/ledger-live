import { updateTransaction as defaultUpdateTransaction } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import type { GenericTransaction } from "./types";

/**
 * The default update, plus the recipient normalization of the bitcoin family: a bc1 segwit address
 * is accepted in any case but is only valid in lowercase.
 */
export function updateTransaction<T extends GenericTransaction>(
  transaction: T,
  patch: Partial<T>,
): T {
  const updated = defaultUpdateTransaction(transaction, patch);
  if (updated.family !== "bitcoin") return updated;
  const recipient = updated.recipient.toLowerCase();
  return recipient.startsWith("bc1") && recipient !== updated.recipient
    ? { ...updated, recipient }
    : updated;
}
