import { createSelector, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { isAccountDataReceived } from "@domain/entity-account-data";
import type { AccountUUID } from "@domain/entity-account-descriptor";
import type { AccountOperation, AccountOperationsQuery } from "./schema";
import { selectAccountOperations, type WithAccountOperations } from "./selectors";

/** By account, the operations a transaction sent from the app is likely to create, newest first. */
export type AccountPendingOperationsState = Partial<Record<AccountUUID, AccountOperation[]>>;

export const initialAccountPendingOperationsState: AccountPendingOperationsState = {};

// A token transfer and its fee share a hash: a read of one asset never retires the other's row.
const listedKey = ({ hash, assetId }: Pick<AccountOperation, "hash" | "assetId">) =>
  `${assetId}:${hash}`;

const isFilteredQueryKey = (queryKey: string): boolean => {
  if (!queryKey) return false;
  const query: unknown = JSON.parse(queryKey);
  return typeof query === "object" && query !== null && "filterAsset" in query;
};

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
    /** A transaction no read will ever list (replaced, dropped from the mempool), or every one of a removed account. */
    pendingOperationsDropped(
      state,
      {
        payload: { accountUUID, hashes },
      }: PayloadAction<{ accountUUID: AccountUUID; hashes?: readonly string[] }>,
    ) {
      const stored = state[accountUUID];
      if (!stored) return;
      const dropped = new Set(hashes);
      const left = hashes ? stored.filter(operation => !dropped.has(operation.hash)) : [];
      if (left.length > 0) state[accountUUID] = left;
      else delete state[accountUUID];
    },
  },
  extraReducers: builder => {
    // Only a read of every asset takes over the rows it lists: a filtered one leaves the others' windows short.
    builder.addMatcher(isAccountDataReceived("operations"), (state, { payload }) => {
      const stored = state[payload.accountUUID];
      if (!stored || isFilteredQueryKey(payload.queryKey)) return;
      const listed = new Set(payload.data.operations.map(listedKey));
      const left = stored.filter(operation => !listed.has(listedKey(operation)));
      if (left.length > 0) state[payload.accountUUID] = left;
      else delete state[payload.accountUUID];
    });
  },
});

export const { pendingOperationsAdded, pendingOperationsDropped } =
  accountPendingOperationsSlice.actions;

export type WithAccountPendingOperations = WithAccountOperations & {
  accountPendingOperations: AccountPendingOperationsState;
};

/** The window of `query`, headed by the operations sent from the app that no read lists yet, whatever the order they came in. */
export const selectAccountOperationsWithPending: (
  state: WithAccountPendingOperations,
  accountUUID: AccountUUID,
  query?: AccountOperationsQuery,
) => AccountOperation[] | undefined = createSelector(
  [
    selectAccountOperations,
    (state: WithAccountPendingOperations, accountUUID: AccountUUID) =>
      state.accountPendingOperations[accountUUID],
    (
      _state: WithAccountPendingOperations,
      _accountUUID: AccountUUID,
      query?: AccountOperationsQuery,
    ) => query?.filterAsset,
  ],
  (read, pending, filterAsset) => {
    if (!pending || !read) return read;
    const listed = new Set(read.map(listedKey));
    const unlisted = pending.filter(
      operation =>
        !listed.has(listedKey(operation)) &&
        (filterAsset === undefined || operation.assetId === filterAsset),
    );
    return unlisted.length > 0 ? [...unlisted, ...read] : read;
  },
);
