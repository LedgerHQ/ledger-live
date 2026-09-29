import type { AccountDataBinding } from "@domain/entity-account-data";
import type {
  AccountOperationsPage,
  AccountOperationsQuery,
  WithAccountOperations,
} from "./schema";
import {
  accountOperationsFailed,
  accountOperationsReceived,
  accountOperationsRequested,
  selectAccountOperationsAt,
  selectAccountOperationsEntry,
  selectAccountOperationsStatus,
} from "./slice";

declare module "@domain/entity-account-data" {
  interface AccountData {
    operations: { query: AccountOperationsQuery; result: AccountOperationsPage };
  }
}

export const accountOperationsBinding: AccountDataBinding<"operations", WithAccountOperations> = {
  datum: "operations",
  requested: accountOperationsRequested,
  received: accountOperationsReceived,
  failed: accountOperationsFailed,
  selectAt: selectAccountOperationsAt,
  selectPending: (state, accountId) => selectAccountOperationsStatus(state, accountId).pending,
  selectSourceId: (state, accountId) => selectAccountOperationsStatus(state, accountId).sourceId,
  selectNextQuery: (state, accountId) => {
    const { nextCursor } = selectAccountOperationsEntry(state, accountId);
    return nextCursor === undefined ? undefined : { cursor: nextCursor };
  },
};
