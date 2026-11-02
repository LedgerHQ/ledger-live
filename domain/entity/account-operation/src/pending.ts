import { createSelector, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { isAccountDataReceived } from "@domain/entity-account-data";
import type { AccountUUID } from "@domain/entity-account-descriptor";
import type { AccountOperation, AccountOperationsState } from "./schema";

/** By account, the operations a transaction sent from the app is likely to create, newest first. */
export type AccountPendingOperationsState = Partial<Record<AccountUUID, AccountOperation[]>>;

export const initialAccountPendingOperationsState: AccountPendingOperationsState = {};

export const accountPendingOperationsSlice = createSlice({
  name: "accountPendingOperations",
  initialState: initialAccountPendingOperationsState,
  reducers: {
    pendingOperationsAdded(
      state,
      {
        payload: { accountUUID, operations },
      }: PayloadAction<{ accountUUID: AccountUUID; operations: AccountOperation[] }>,
    ) {
      const stored = state[accountUUID] ?? [];
      const known = new Set(stored.map(operation => operation.id));
      state[accountUUID] = [...operations.filter(operation => !known.has(operation.id)), ...stored];
    },
  },
  extraReducers: builder => {
    // A read listing a transaction's hash takes over its rows, confirmed or still pending.
    builder.addMatcher(isAccountDataReceived("operations"), (state, { payload }) => {
      const stored = state[payload.accountUUID];
      if (!stored) return;
      const listed = new Set(payload.data.operations.map(operation => operation.hash));
      const left = stored.filter(operation => !listed.has(operation.hash));
      if (left.length > 0) state[payload.accountUUID] = left;
      else delete state[payload.accountUUID];
    });
  },
});

export const { pendingOperationsAdded } = accountPendingOperationsSlice.actions;

export type WithAccountPendingOperations = {
  accountOperations: AccountOperationsState;
  accountPendingOperations: AccountPendingOperationsState;
};

/** The operations read, headed by the ones sent from the app that no read lists yet. */
export const selectAccountOperationsWithPending: (
  state: WithAccountPendingOperations,
  accountUUID: AccountUUID,
) => AccountOperation[] | undefined = createSelector(
  [
    (state: WithAccountPendingOperations, accountUUID: AccountUUID) =>
      state.accountOperations[accountUUID],
    (state: WithAccountPendingOperations, accountUUID: AccountUUID) =>
      state.accountPendingOperations[accountUUID],
  ],
  (read, pending) => (pending ? [...pending, ...(read ?? [])] : read),
);
