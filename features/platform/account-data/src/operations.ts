import type { AccountOperation } from "@domain/entity-account-operations";
import { NoAccountSourceError } from "./errors";
import { pickSource, type AccountRef, type AccountSource } from "./source";

export type AccountOperationsQuery = {
  cursor?: string;
  limit?: number;
};

export type AccountOperationsPage = {
  operations: AccountOperation[];
  nextCursor?: string;
  complete: boolean;
  total?: number;
};

export type AccountOperationsSource = AccountSource & {
  readonly paginated: boolean;
  getOperations(
    ref: AccountRef,
    query: AccountOperationsQuery,
    signal?: AbortSignal,
  ): Promise<AccountOperationsPage>;
};

export async function readAccountOperations(
  ref: AccountRef,
  sources: readonly AccountOperationsSource[],
  query: AccountOperationsQuery = {},
  signal?: AbortSignal,
): Promise<AccountOperationsPage & { sourceId: string }> {
  const source = pickSource(ref, sources);
  if (!source) throw new NoAccountSourceError(ref.accountId, "operations");
  const resumable = source.paginated ? query : { ...query, cursor: undefined };
  return { ...(await source.getOperations(ref, resumable, signal)), sourceId: source.id };
}
