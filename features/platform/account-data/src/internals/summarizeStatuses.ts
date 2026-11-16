import type { AccountDataError, AccountDataStatus } from "@domain/entity-account-data";
import type { AccountUUID } from "@domain/entity-account-descriptor";

/** What a list of accounts' statuses amounts to: the failed accounts, and whether a head read is in flight. */
export function summarizeStatuses(
  accountUUIDs: readonly AccountUUID[],
  statuses: readonly (AccountDataStatus | undefined)[],
): { errors: { accountUUID: AccountUUID; error: AccountDataError }[]; pending: boolean } {
  const errors = accountUUIDs.flatMap((accountUUID, i) => {
    const error = statuses[i]?.error;
    return error ? [{ accountUUID, error }] : [];
  });
  const pending = statuses.some(status => status?.request?.append === false);
  return { errors, pending };
}
