import type { TransactionStatus } from "../../../generated/types";

function withoutKeys(
  record: Record<string, Error>,
  keys: readonly string[],
): Record<string, Error> {
  return Object.fromEntries(Object.entries(record).filter(([key]) => !keys.includes(key)));
}

/** Drops the status entries a sponsored fee pays for; returns `status` itself when none is present. */
export function withoutWaivedStatus(
  status: TransactionStatus,
  waivesErrorKeys: readonly string[],
  waivesWarningKeys: readonly string[],
): TransactionStatus {
  const waivesAny =
    waivesErrorKeys.some(key => status.errors?.[key]) ||
    waivesWarningKeys.some(key => status.warnings?.[key]);
  if (!waivesAny) return status;
  return {
    ...status,
    errors: withoutKeys(status.errors, waivesErrorKeys),
    warnings: withoutKeys(status.warnings, waivesWarningKeys),
  };
}
