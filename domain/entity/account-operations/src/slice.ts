import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AccountId } from "@shared/schema-primitives";
import {
  EMPTY_ACCOUNT_OPERATIONS_ENTRY,
  IDLE_ACCOUNT_OPERATIONS_STATUS,
  initialAccountOperationsState,
  type AccountOperation,
  type AccountOperationsEntry,
  type AccountOperationsState,
  type AccountOperationsStatus,
} from "./schema";

/** What a source hands back for one read. */
export type AccountOperationsPagePayload = {
  accountId: AccountId;
  operations: AccountOperation[];
  nextCursor?: string;
  /** Whether the source knows this is the end of the history. */
  complete: boolean;
  sourceId: string;
  total?: number;
  /** When the read happened, ISO 8601. */
  at: string;
};

const byDateDesc = (a: AccountOperation, b: AccountOperation): number => {
  if (a.date > b.date) return -1;
  if (a.date < b.date) return 1;
  // Same instant: fall back to the id so the order is total and stable across reads. Chains
  // routinely stamp every operation in a block with the block's time, so this is the common case,
  // not a tie-break curiosity.
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
};

/**
 * Merge a page into a window, newest first, without duplicating what is already there.
 *
 * Deduplicated by id rather than trusted to be disjoint: a refresh re-reads the newest page, and a
 * paginated source can legitimately repeat a boundary operation between two pages.
 */
const merge = (existing: AccountOperation[], incoming: AccountOperation[]): AccountOperation[] => {
  const seen = new Set(incoming.map(operation => operation.id));
  return [...incoming, ...existing.filter(operation => !seen.has(operation.id))].sort(byDateDesc);
};

export const accountOperationsSlice = createSlice({
  name: "accountOperations",
  initialState: initialAccountOperationsState,
  reducers: {
    /** A read for this account has started. Clears any previous error so a retry shows clean. */
    accountOperationsRequested: (state, { payload }: PayloadAction<AccountId>) => {
      state.status[payload] = { pending: true, sourceId: state.status[payload]?.sourceId };
    },

    /**
     * The newest page arrived — a first load or a refresh.
     *
     * Replaces the window rather than merging into it. A refresh that merged would keep operations
     * the chain has since reorganised away, and there is no cursor that means "everything after
     * this", so the only honest thing a head read can say is *this is the head now*.
     */
    accountOperationsReceived: (
      state,
      { payload }: PayloadAction<AccountOperationsPagePayload>,
    ) => {
      const { accountId, operations, nextCursor, complete, sourceId, total, at } = payload;
      state.byAccount[accountId] = {
        operations: [...operations].sort(byDateDesc),
        ...(nextCursor === undefined ? {} : { nextCursor }),
        complete,
        at,
        ...(total === undefined ? {} : { total }),
      };
      state.status[accountId] = { pending: false, sourceId };
    },

    /**
     * An older page arrived — "load more".
     *
     * Appends and keeps `at` untouched: reading further back says nothing about whether newer
     * operations have appeared since, and stamping it here would make the freshness guard skip the
     * refresh that a "load more" is most likely to be followed by.
     */
    accountOperationsAppended: (
      state,
      { payload }: PayloadAction<AccountOperationsPagePayload>,
    ) => {
      const { accountId, operations, nextCursor, complete, sourceId, total } = payload;
      const entry = state.byAccount[accountId] ?? { ...EMPTY_ACCOUNT_OPERATIONS_ENTRY };
      state.byAccount[accountId] = {
        ...entry,
        operations: merge(entry.operations, operations),
        ...(nextCursor === undefined ? {} : { nextCursor }),
        complete,
        ...(total === undefined ? {} : { total }),
      };
      if (nextCursor === undefined) delete state.byAccount[accountId].nextCursor;
      state.status[accountId] = { pending: false, sourceId };
    },

    /** The read failed. The window is left alone: a stale page beats an empty list. */
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

    /** Drop the given accounts — on account removal. */
    accountOperationsRemoved: (state, { payload }: PayloadAction<AccountId[]>) => {
      for (const accountId of payload) {
        delete state.byAccount[accountId];
        delete state.status[accountId];
      }
    },

    /** Empty the table — on profile reset or account-store re-hydration. */
    accountOperationsReset: () => initialAccountOperationsState,
  },

  selectors: {
    /** The loaded window, newest first. Empty when nothing has been read. */
    selectAccountOperations: (
      state: AccountOperationsState,
      accountId: AccountId,
    ): readonly AccountOperation[] =>
      state.byAccount[accountId]?.operations ?? EMPTY_ACCOUNT_OPERATIONS_ENTRY.operations,

    /** The window's metadata: how far it reaches and whether more can be asked for. */
    selectAccountOperationsEntry: (
      state: AccountOperationsState,
      accountId: AccountId,
    ): AccountOperationsEntry => state.byAccount[accountId] ?? EMPTY_ACCOUNT_OPERATIONS_ENTRY,

    /** Whether asking for more would return anything. */
    selectHasMoreAccountOperations: (
      state: AccountOperationsState,
      accountId: AccountId,
    ): boolean => state.byAccount[accountId]?.nextCursor !== undefined,

    /**
     * How many operations the account has, when that is knowable — `undefined` otherwise.
     *
     * Not `operations.length`: that is how many are *loaded*, and returning it here would quietly
     * turn every "N transactions" label into a lie the moment pagination is real. Callers that only
     * need the loaded count read the window.
     */
    selectAccountOperationsTotal: (
      state: AccountOperationsState,
      accountId: AccountId,
    ): number | undefined => {
      const entry = state.byAccount[accountId];
      if (!entry) return undefined;
      // A complete window is its own total: nothing more exists to count.
      return entry.total ?? (entry.complete ? entry.operations.length : undefined);
    },

    /** Outcome of the last read: pending, error, and which source answered. */
    selectAccountOperationsStatus: (
      state: AccountOperationsState,
      accountId: AccountId,
    ): AccountOperationsStatus => state.status[accountId] ?? IDLE_ACCOUNT_OPERATIONS_STATUS,

    /** When the head was last read, in epoch ms — `undefined` when it never was. */
    selectAccountOperationsAt: (
      state: AccountOperationsState,
      accountId: AccountId,
    ): number | undefined => {
      const at = state.byAccount[accountId]?.at;
      return at === undefined ? undefined : new Date(at).getTime();
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
