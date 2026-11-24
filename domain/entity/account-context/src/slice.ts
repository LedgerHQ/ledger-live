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
  },
  selectors: {
    selectAccountContext: (state, accountUUID: AccountUUID): AccountContext | undefined =>
      isInheritedKey(accountUUID) ? undefined : state[accountUUID],
  },
});

export const { accountContextReceived, accountContextRemoved } = accountContextSlice.actions;

export const { selectAccountContext } = accountContextSlice.selectors;

export default accountContextSlice.reducer;
