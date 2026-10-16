import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { isAccountDataReceived } from "@domain/entity-account-data";
import type { AccountUUID } from "@domain/entity-account-descriptor";
import type { AccountOperation } from "./schema";

export type AccountOperationsEntry = { operations: AccountOperation[]; total?: number };

export type AccountOperationsState = Partial<Record<AccountUUID, AccountOperationsEntry>>;

export type WithAccountOperations = { accountOperations: AccountOperationsState };

const codepoint = (a: string, b: string): number => {
  if (a < b) return -1;
  return a > b ? 1 : 0;
};

/** Newest first, by instant: a `DateTimeIso` may carry an offset, so strings do not sort. */
export const compareAccountOperations = (a: AccountOperation, b: AccountOperation): number => {
  const byDate = Date.parse(b.date) - Date.parse(a.date);
  return byDate === 0 || Number.isNaN(byDate) ? codepoint(a.id, b.id) : byDate;
};

// The copy already stored wins: sources repeat the rows at a page boundary.
const merge = (stored: AccountOperation[], incoming: AccountOperation[]) => {
  const byId = new Map<string, AccountOperation>();
  for (const operation of [...stored, ...incoming]) {
    if (!byId.has(operation.id)) byId.set(operation.id, operation);
  }
  return [...byId.values()].sort(compareAccountOperations);
};

const initialState: AccountOperationsState = {};

export const accountOperationsSlice = createSlice({
  name: "accountOperations",
  initialState,
  reducers: {
    accountOperationsRemoved: (state, { payload }: PayloadAction<AccountUUID[]>) => {
      for (const accountUUID of payload) delete state[accountUUID];
    },
  },
  extraReducers: builder => {
    // A head read replaces, so a reorg drops what it dropped; a next page reaches a settled past and merges.
    builder.addMatcher(isAccountDataReceived("operations"), (state, { payload }) => {
      const { operations, total } = payload.data;
      const stored = payload.append ? (state[payload.accountUUID]?.operations ?? []) : [];
      const known = payload.append ? state[payload.accountUUID]?.total : undefined;
      state[payload.accountUUID] = { operations: merge(stored, operations), total: total ?? known };
    });
  },
});

export const { accountOperationsRemoved } = accountOperationsSlice.actions;

const NO_OPERATIONS: readonly AccountOperation[] = [];

export const selectAccountOperations = (
  state: WithAccountOperations,
  accountUUID: AccountUUID,
): readonly AccountOperation[] => state.accountOperations[accountUUID]?.operations ?? NO_OPERATIONS;

export const selectAccountOperationsTotal = (
  state: WithAccountOperations,
  accountUUID: AccountUUID,
): number | undefined => state.accountOperations[accountUUID]?.total;
