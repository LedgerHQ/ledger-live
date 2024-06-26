import type { SyncConfig } from "@ledgerhq/types-live";

export function getOperationsPageSize(
  accountId: string | null | undefined,
  syncConfig: SyncConfig,
): number {
  const { paginationConfig } = syncConfig;
  const { operationsPerAccountId, operations } = paginationConfig;
  const numbers: number[] = [];

  if (operationsPerAccountId && accountId && accountId in operationsPerAccountId) {
    numbers.push(operationsPerAccountId[accountId]);
  }

  if (typeof operations === "number") {
    numbers.push(operations);
  }

  if (numbers.length === 0) return Infinity;
  return Math.max(...numbers);
}
