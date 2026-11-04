import { createSelector } from "@reduxjs/toolkit";
import { accountDataQueryKey } from "@domain/entity-account-data";
import type { AccountUUID } from "@domain/entity-account-descriptor";
import type {
  AccountOperation,
  AccountOperationsQuery,
  AccountOperationsState,
  OperationId,
  StoredAccountOperation,
} from "./schema";

export type WithAccountOperations = { accountOperations: AccountOperationsState };

const selectWindow = (
  state: WithAccountOperations,
  accountUUID: AccountUUID,
  query?: AccountOperationsQuery,
) => state.accountOperations[accountUUID]?.windows[accountDataQueryKey(query)];

const selectWindowCountervalues = (
  state: WithAccountOperations,
  accountUUID: AccountUUID,
  query?: AccountOperationsQuery,
) => state.accountOperations[accountUUID]?.countervalues[accountDataQueryKey(query)];

const selectById = (state: WithAccountOperations, accountUUID: AccountUUID) =>
  state.accountOperations[accountUUID]?.byId;

/** The loaded window of `query`, as its source answered it: nothing is filtered here. */
export const selectAccountOperations: (
  state: WithAccountOperations,
  accountUUID: AccountUUID,
  query?: AccountOperationsQuery,
) => AccountOperation[] | undefined = createSelector(
  [selectWindow, selectById, selectWindowCountervalues],
  (window, byId, countervaluesById) =>
    window &&
    byId &&
    window.flatMap(id => {
      const row = byId[id];
      if (!row) return [];
      const countervalues = countervaluesById?.[id];
      return countervalues ? { ...row, countervalues } : row;
    }),
);

/** One row, whatever query read it, without countervalues: those belong to the query that asked them. */
export const selectAccountOperation = (
  state: WithAccountOperations,
  accountUUID: AccountUUID,
  operationId: OperationId,
): StoredAccountOperation | undefined => state.accountOperations[accountUUID]?.byId[operationId];
