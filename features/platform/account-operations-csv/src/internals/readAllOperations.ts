import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import { fetchAccountData, fetchMoreAccountData } from "@domain/api-account-data";
import {
  selectAccountDataStatus,
  type AccountDataError,
  type AccountDataRootState,
} from "@domain/entity-account-data";
import { computeAccountUUID, type AccountDescriptor } from "@domain/entity-account-descriptor";
import {
  selectAccountOperations,
  type AccountOperation,
  type AccountOperationsQuery,
  type WithAccountOperations,
} from "@domain/entity-account-operation";
import { AccountOperationsReadError } from "../errors";

const PAGING_STALLED: AccountDataError = {
  name: "AccountOperationsPagingError",
  message: "the next page cursor was already read",
};

export type ReadOperationsState = AccountDataRootState & WithAccountOperations;

export type ReadOperationsDispatch = ThunkDispatch<ReadOperationsState, unknown, UnknownAction>;

/** Every operation of an account, read again from its first page whatever the freshness. */
export async function readAllOperations(
  dispatch: ReadOperationsDispatch,
  getState: () => ReadOperationsState,
  descriptor: AccountDescriptor,
  query: AccountOperationsQuery,
): Promise<AccountOperation[]> {
  const accountUUID = computeAccountUUID(descriptor);

  /**
   * Reads the page after the stored ones until none is left. A cursor already read means the page
   * did not move on, or the source loops: it rejects rather than return a partial history.
   */
  const readNextPages = async (readCursors: ReadonlySet<string>): Promise<void> => {
    const status = selectAccountDataStatus(getState(), "operations", accountUUID, query);
    if (status?.error) throw new AccountOperationsReadError(accountUUID, status.error);
    const cursor = status?.nextCursor;
    if (cursor === undefined) return;
    if (readCursors.has(cursor)) throw new AccountOperationsReadError(accountUUID, PAGING_STALLED);
    await dispatch(fetchMoreAccountData("operations", descriptor, { query }));
    return readNextPages(new Set(readCursors).add(cursor));
  };

  await dispatch(fetchAccountData("operations", descriptor, { maxAge: 0, query }));
  await readNextPages(new Set());
  return selectAccountOperations(getState(), accountUUID, query) ?? [];
}
