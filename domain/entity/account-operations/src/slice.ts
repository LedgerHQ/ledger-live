import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AccountId } from "@domain/entity-account";
import {
  EMPTY_ACCOUNT_OPERATIONS_ENTRY,
  IDLE_ACCOUNT_OPERATIONS_STATUS,
  initialAccountOperationsState,
  type AccountOperation,
  type AccountOperationsEntry,
  type AccountOperationsState,
  type AccountOperationsStatus,
} from "./schema";

export type AccountOperationsPagePayload = {
  accountId: AccountId;
  operations: AccountOperation[];
  nextCursor?: string;
  complete: boolean;
  sourceId: string;
  total?: number;
  at: string;
};

const codepoint = (a: string, b: string): number => {
  if (a < b) return -1;
  return a > b ? 1 : 0;
};

export const compareAccountOperations = (a: AccountOperation, b: AccountOperation): number => {
  // Instants, not strings: `DateTimeIso` admits an offset, so `2026-01-31T12:00:00+05:30` and
  // `2026-01-31T06:30:00Z` are the same moment and sort lexicographically as if they were not.
  const byDate = Date.parse(b.date) - Date.parse(a.date);
  return byDate === 0 || Number.isNaN(byDate) ? codepoint(a.id, b.id) : byDate;
};

/**
 * A window for one account holds its own operations *and* its token accounts' — that is the fan-out.
 * Anything else is a source bug, and storing it would pollute a window this read never asked about.
 */
const ownedBy = (accountId: AccountId) => (operation: AccountOperation) =>
  operation.accountId === accountId || operation.accountId.startsWith(`${accountId}+`);

const merge = (existing: AccountOperation[], incoming: AccountOperation[]): AccountOperation[] => {
  // Existing first, so a duplicate at a page boundary keeps the copy already in state: it came from
  // a more recent read than the older page being appended.
  const byId = new Map<string, AccountOperation>();
  for (const operation of [...existing, ...incoming]) {
    if (!byId.has(operation.id)) byId.set(operation.id, operation);
  }
  return [...byId.values()].sort(compareAccountOperations);
};

export const accountOperationsSlice = createSlice({
  name: "accountOperations",
  initialState: initialAccountOperationsState,
  reducers: {
    accountOperationsRequested: (state, { payload }: PayloadAction<AccountId>) => {
      state.status[payload] = { pending: true, sourceId: state.status[payload]?.sourceId };
    },

    accountOperationsReceived: (
      state,
      { payload }: PayloadAction<AccountOperationsPagePayload>,
    ) => {
      const { accountId, operations, nextCursor, complete, sourceId, total, at } = payload;
      state.byAccount[accountId] = {
        operations: operations.filter(ownedBy(accountId)).sort(compareAccountOperations),
        ...(nextCursor === undefined ? {} : { nextCursor }),
        complete,
        at,
        ...(total === undefined ? {} : { total }),
      };
      state.status[accountId] = { pending: false, sourceId };
    },

    accountOperationsAppended: (
      state,
      { payload }: PayloadAction<AccountOperationsPagePayload>,
    ) => {
      const { accountId, operations, nextCursor, complete, sourceId, total, at } = payload;
      const entry = state.byAccount[accountId] ?? { ...EMPTY_ACCOUNT_OPERATIONS_ENTRY };
      state.byAccount[accountId] = {
        ...entry,
        operations: merge(entry.operations, operations.filter(ownedBy(accountId))),
        ...(nextCursor === undefined ? {} : { nextCursor }),
        complete,
        ...(total === undefined ? {} : { total }),
        // Only when there is none: reading further back says nothing about how fresh the head is, but
        // an append with no prior head read would otherwise leave the window with no timestamp at all.
        at: entry.at ?? at,
      };
      if (nextCursor === undefined) delete state.byAccount[accountId].nextCursor;
      state.status[accountId] = { pending: false, sourceId };
    },

    accountOperationsFailed: (
      state,
      { payload }: PayloadAction<{ accountId: AccountId; error: string }>,
    ) => {
      state.status[payload.accountId] = {
        pending: false,
        error: payload.error,
        sourceId: state.status[payload.accountId]?.sourceId,
      };
    },

    accountOperationsRemoved: (state, { payload }: PayloadAction<AccountId[]>) => {
      for (const accountId of payload) {
        delete state.byAccount[accountId];
        delete state.status[accountId];
      }
    },

    accountOperationsReset: () => initialAccountOperationsState,
  },

  selectors: {
    selectAccountOperations: (
      state: AccountOperationsState,
      accountId: AccountId,
    ): readonly AccountOperation[] =>
      state.byAccount[accountId]?.operations ?? EMPTY_ACCOUNT_OPERATIONS_ENTRY.operations,

    selectAccountOperationsEntry: (
      state: AccountOperationsState,
      accountId: AccountId,
    ): AccountOperationsEntry => state.byAccount[accountId] ?? EMPTY_ACCOUNT_OPERATIONS_ENTRY,

    selectHasMoreAccountOperations: (
      state: AccountOperationsState,
      accountId: AccountId,
    ): boolean => state.byAccount[accountId]?.nextCursor !== undefined,

    selectAccountOperationsTotal: (
      state: AccountOperationsState,
      accountId: AccountId,
    ): number | undefined => {
      const entry = state.byAccount[accountId];
      if (!entry) return undefined;
      return entry.total ?? (entry.complete ? entry.operations.length : undefined);
    },

    selectAccountOperationsStatus: (
      state: AccountOperationsState,
      accountId: AccountId,
    ): AccountOperationsStatus => state.status[accountId] ?? IDLE_ACCOUNT_OPERATIONS_STATUS,

    selectAccountOperationsAt: (
      state: AccountOperationsState,
      accountId: AccountId,
    ): number | undefined => {
      const at = state.byAccount[accountId]?.at;
      if (at === undefined) return undefined;
      const ms = Date.parse(at);
      // Persisted state can hold anything: an unparseable stamp is "not read", never `NaN` — every
      // caller compares this against a freshness window.
      return Number.isNaN(ms) ? undefined : ms;
    },
  },
});

export const {
  accountOperationsRequested,
  accountOperationsReceived,
  accountOperationsAppended,
  accountOperationsFailed,
  accountOperationsRemoved,
  accountOperationsReset,
} = accountOperationsSlice.actions;

export const {
  selectAccountOperations,
  selectAccountOperationsEntry,
  selectHasMoreAccountOperations,
  selectAccountOperationsTotal,
  selectAccountOperationsStatus,
  selectAccountOperationsAt,
} = accountOperationsSlice.selectors;
