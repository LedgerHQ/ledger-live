import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AccountUUID } from "@domain/entity-account";
import { initialAccountContextState, type AccountContext } from "./schema";

/** Keys come from action payloads: one inherited from `Object.prototype` is never a record entry. */
const isInheritedKey = (key: string) => key in Object.prototype;

export const accountContextSlice = createSlice({
  name: "accountContext",
  initialState: initialAccountContextState,
  reducers: {
    /** Merges into what the account already has: a field it does not name stays. */
    accountContextReceived: (
      state,
      { payload }: PayloadAction<{ accountUUID: AccountUUID; context: AccountContext }>,
    ) => {
      const { accountUUID, context } = payload;
      if (isInheritedKey(accountUUID)) return;
      state[accountUUID] = { ...state[accountUUID], ...context };
    },
    accountContextRemoved: (state, { payload }: PayloadAction<AccountUUID>) => {
      if (!isInheritedKey(payload)) delete state[payload];
    },
    /** The contexts the held legacy accounts keep: replaces theirs, drops those of removed accounts, leaves the others. */
    legacyAccountContextsSynced: (
      state,
      {
        payload,
      }: PayloadAction<{
        contexts: ReadonlyArray<{ accountUUID: AccountUUID; context: AccountContext }>;
        removed: readonly AccountUUID[];
      }>,
    ) => {
      for (const accountUUID of payload.removed) {
        if (!isInheritedKey(accountUUID)) delete state[accountUUID];
      }
      for (const { accountUUID, context } of payload.contexts) {
        if (!isInheritedKey(accountUUID)) state[accountUUID] = context;
      }
    },
  },
  selectors: {
    selectAccountContext: (state, accountUUID: AccountUUID): AccountContext | undefined =>
      isInheritedKey(accountUUID) ? undefined : state[accountUUID],
  },
});

export const { accountContextReceived, accountContextRemoved, legacyAccountContextsSynced } =
  accountContextSlice.actions;

export const { selectAccountContext } = accountContextSlice.selectors;

export default accountContextSlice.reducer;
