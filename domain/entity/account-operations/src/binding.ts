import type { AccountDataBinding } from "@domain/entity-account-data";
import type {
  AccountOperationsPage,
  AccountOperationsQuery,
  WithAccountOperations,
} from "./schema";
import {
  accountOperationsAppended,
  accountOperationsFailed,
  accountOperationsReceived,
  accountOperationsRequested,
  selectAccountOperationsAt,
  selectAccountOperationsEntry,
  selectAccountOperationsStatus,
} from "./slice";

export const DEFAULT_OPERATIONS_PAGE_SIZE = 50;

declare module "@domain/entity-account-data" {
  interface AccountData {
    operations: { query: AccountOperationsQuery; result: AccountOperationsPage };
  }
}

export const accountOperationsBinding: AccountDataBinding<"operations", WithAccountOperations> = {
  datum: "operations",
  headQuery: { limit: DEFAULT_OPERATIONS_PAGE_SIZE },
  requested: accountOperationsRequested,
  received: ({ accountId, data, sourceId, append }) => {
    const payload = { accountId, ...data, sourceId, at: new Date().toISOString() };
    return append ? accountOperationsAppended(payload) : accountOperationsReceived(payload);
  },
  failed: accountOperationsFailed,
  selectAt: selectAccountOperationsAt,
  selectPending: (state, accountId) => selectAccountOperationsStatus(state, accountId).pending,
  selectSourceId: (state, accountId) => selectAccountOperationsStatus(state, accountId).sourceId,
  selectNextQuery: (state, accountId) => {
    const { nextCursor } = selectAccountOperationsEntry(state, accountId);
    return nextCursor === undefined
      ? undefined
      : { cursor: nextCursor, limit: DEFAULT_OPERATIONS_PAGE_SIZE };
  },
};
