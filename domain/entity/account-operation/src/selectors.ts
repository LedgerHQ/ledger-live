import { createSelector } from "@reduxjs/toolkit";
import { accountDataQueryKey } from "@domain/entity-account-data";
import type { AccountUUID } from "@domain/entity-account-descriptor";
import type {
  AccountOperation,
  AccountOperationsQuery,
  AccountOperationsState,
  OperationId,
} from "./schema";

export type WithAccountOperations = { accountOperations: AccountOperationsState };

const selectWindow = (
  state: WithAccountOperations,
  accountUUID: AccountUUID,
  query?: AccountOperationsQuery,
) => state.accountOperations[accountUUID]?.windows[accountDataQueryKey(query)];

const selectById = (state: WithAccountOperations, accountUUID: AccountUUID) =>
  state.accountOperations[accountUUID]?.byId;

/** The loaded window of `query`, as its source answered it: nothing is filtered here. */
export const selectAccountOperations: (
  state: WithAccountOperations,
  accountUUID: AccountUUID,
  query?: AccountOperationsQuery,
) => AccountOperation[] | undefined = createSelector(
  [selectWindow, selectById],
  (window, byId) => window && byId && window.flatMap(id => byId[id] ?? []),
);

/** One row, whatever query read it. */
export const selectAccountOperation = (
  state: WithAccountOperations,
  accountUUID: AccountUUID,
  operationId: OperationId,
): AccountOperation | undefined => state.accountOperations[accountUUID]?.byId[operationId];
