// @flow
import type { SyncConfig } from "../types";

export function getOperationsPageSize(
  accountId: string,
  syncConfig: SyncConfig
): number {
  const { paginationConfig } = syncConfig;
  const { operationsPerAccountId, operations } = paginationConfig;
  const numbers = [];
  if (operationsPerAccountId && accountId in operationsPerAccountId) {
    numbers.push(operationsPerAccountId[accountId]);
  }
  if (operations) {
    numbers.push(operations);
  }
  return Math.max(...numbers);
}
