import { createEntityAdapter, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AccountUUID } from "@domain/entity-account-descriptor";
import type { AccountId } from "./legacy/schema";
import {
  initialAccountsState,
  type AccountEntry,
  type AccountsState,
  type LegacyAccountEntry,
  type RemoteAccountEntry,
} from "./schema";

const accountsAdapter = createEntityAdapter({
  selectId: (entry: AccountEntry) => entry.accountUUID,
});

const adapterSelectors = accountsAdapter.getSelectors();

export const accountsSlice = createSlice({
  name: "accounts",
  initialState: initialAccountsState,
  reducers: {
    /** The legacy accounts, in their order: replaces every entry backed by one, keeps the remote-only ones after. */
    legacyAccountsSynced: (state, { payload }: PayloadAction<LegacyAccountEntry[]>) => {
      const legacy = new Set(payload.map(entry => entry.accountUUID));
      const remoteOnly = adapterSelectors
        .selectAll(state)
        .filter(entry => !entry.legacyId && !legacy.has(entry.accountUUID));
      accountsAdapter.setAll(state, [...payload, ...remoteOnly]);
      const byLegacyId: AccountsState["byLegacyId"] = {};
      for (const { legacyId, accountUUID } of payload) byLegacyId[legacyId] = accountUUID;
      state.byLegacyId = byLegacyId;
    },
    /** Accounts no legacy account backs, after the others; an account already listed is left as is. */
    remoteAccountsAdded: (state, { payload }: PayloadAction<RemoteAccountEntry[]>) => {
      accountsAdapter.addMany(state, payload);
    },
    /** Removes remote-only accounts; one a legacy account backs stays. */
    remoteAccountsRemoved: (state, { payload }: PayloadAction<AccountUUID[]>) => {
      accountsAdapter.removeMany(
        state,
        payload.filter(accountUUID => !state.entities[accountUUID]?.legacyId),
      );
    },
  },
  selectors: {
    /** Every account, in the user's order. */
    selectAccountEntries: (state): AccountEntry[] => adapterSelectors.selectAll(state),
    selectAccountUUIDs: (state): AccountUUID[] => state.ids,
    selectAccountEntry: (state, accountUUID: AccountUUID): AccountEntry | undefined =>
      adapterSelectors.selectById(state, accountUUID),
    /** The account behind a legacy account id, for the boundary with legacy screens. */
    selectAccountUUIDByLegacyId: (state, legacyId: AccountId): AccountUUID | undefined =>
      state.byLegacyId[legacyId],
  },
});

export const { legacyAccountsSynced, remoteAccountsAdded, remoteAccountsRemoved } =
  accountsSlice.actions;
