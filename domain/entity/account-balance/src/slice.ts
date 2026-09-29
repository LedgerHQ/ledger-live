import { createSelector, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AccountId, AnyAccountId } from "@domain/entity-account";
import {
  IDLE_ACCOUNT_BALANCE_STATUS,
  initialAccountBalancesState,
  type AccountBalance,
  type AccountBalanceRows,
  type AccountBalanceStatus,
  type AccountBalancesState,
} from "./schema";

const NO_BALANCES: readonly AccountBalance[] = [];

const subBalancesIndex = createSelector(
  (rows: AccountBalanceRows) => rows,
  rows => {
    const index: Record<AccountId, AccountBalance[]> = {};
    for (const balance of Object.values(rows)) {
      if (!balance.parentId) continue;
      const siblings = index[balance.parentId] ?? [];
      siblings.push(balance);
      index[balance.parentId] = siblings;
    }
    return index;
  },
);

export const accountBalancesSlice = createSlice({
  name: "accountBalances",
  initialState: initialAccountBalancesState,
  reducers: {
    accountBalanceRequested: (state, { payload }: PayloadAction<AccountId>) => {
      state.status[payload] = { pending: true, sourceId: state.status[payload]?.sourceId };
    },

    accountBalanceReceived: (
      state,
      {
        payload,
      }: PayloadAction<{ accountId: AccountId; balances: AccountBalance[]; sourceId: string }>,
    ) => {
      // A read answers for one account: its own row and its token accounts'. Anything else in the
      // payload is a source bug, and writing it would corrupt a table this read never asked about.
      const incoming = payload.balances.filter(
        balance =>
          balance.accountId === payload.accountId || balance.parentId === payload.accountId,
      );
      const next = new Set(incoming.map(balance => balance.accountId));
      for (const [accountId, balance] of Object.entries(state.rows) as [
        AnyAccountId,
        AccountBalance,
      ][]) {
        const owned = accountId === payload.accountId || balance.parentId === payload.accountId;
        if (owned && !next.has(accountId)) delete state.rows[accountId];
      }
      for (const balance of incoming) state.rows[balance.accountId] = balance;
      state.status[payload.accountId] = { pending: false, sourceId: payload.sourceId };
    },

    accountBalanceFailed: (
      state,
      { payload }: PayloadAction<{ accountId: AccountId; error: string }>,
    ) => {
      state.status[payload.accountId] = {
        pending: false,
        error: payload.error,
        sourceId: state.status[payload.accountId]?.sourceId,
      };
    },

    accountBalancesRemoved: (state, { payload }: PayloadAction<AccountId[]>) => {
      const removed = new Set<AnyAccountId>(payload);
      for (const [accountId, balance] of Object.entries(state.rows) as [
        AnyAccountId,
        AccountBalance,
      ][]) {
        if (removed.has(accountId) || (balance.parentId && removed.has(balance.parentId))) {
          delete state.rows[accountId];
        }
      }
      for (const accountId of payload) delete state.status[accountId];
    },

    accountBalancesReset: () => initialAccountBalancesState,
  },

  selectors: {
    selectAccountBalance: (
      state: AccountBalancesState,
      accountId: AnyAccountId,
    ): AccountBalance | undefined => state.rows[accountId],

    selectSubAccountBalances: (
      state: AccountBalancesState,
      accountId: AccountId,
    ): readonly AccountBalance[] => subBalancesIndex(state.rows)[accountId] ?? NO_BALANCES,

    selectAccountBalanceStatus: (
      state: AccountBalancesState,
      accountId: AccountId,
    ): AccountBalanceStatus => state.status[accountId] ?? IDLE_ACCOUNT_BALANCE_STATUS,

    selectAccountBalanceAt: (
      state: AccountBalancesState,
      accountId: AccountId,
    ): number | undefined => {
      const at = state.rows[accountId]?.at;
      if (at === undefined) return undefined;
      const ms = Date.parse(at);
      // Persisted state can hold anything: an unparseable stamp is "not read", never `NaN` — every
      // caller compares this against a freshness window.
      return Number.isNaN(ms) ? undefined : ms;
    },

    selectAccountBalanceRows: (state: AccountBalancesState): AccountBalanceRows => state.rows,
  },
});

export const {
  accountBalanceRequested,
  accountBalanceReceived,
  accountBalanceFailed,
  accountBalancesRemoved,
  accountBalancesReset,
} = accountBalancesSlice.actions;

export const {
  selectAccountBalance,
  selectSubAccountBalances,
  selectAccountBalanceStatus,
  selectAccountBalanceAt,
  selectAccountBalanceRows,
} = accountBalancesSlice.selectors;
