import type { TransactionStatus } from "@ledgerhq/live-common/generated/types";

export function getStatusError(
  errors: TransactionStatus["errors"] | undefined,
  key: string,
): Error | undefined {
  if (!errors) return undefined;
  return errors[key];
}

export function pickBlockingError(
  errors: TransactionStatus["errors"] | undefined,
): Error | undefined {
  if (!errors) return undefined;

  // Prefer errors that are commonly tied to amount validity on UTXO chains.
  const priorityKeys = ["dustLimit", "recipient", "fees", "transaction"] as const;
  for (const key of priorityKeys) {
    const err = errors[key];
    if (err) return err;
  }

  return Object.values(errors).find(Boolean);
}
