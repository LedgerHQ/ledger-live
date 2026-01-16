import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { z } from "zod";

import { AccountSchema, AccountsByIdSchema } from "./schema";

export type Account = z.infer<typeof AccountSchema>;
export type AccountsById = z.infer<typeof AccountsByIdSchema>;

export type AccountsState = {
  readonly byId: AccountsById;
  readonly allIds: string[];
};

const initialState: AccountsState = {
  byId: {},
  allIds: [],
};

export const accountsSlice = createSlice({
  name: "v4Accounts",
  initialState,
  reducers: {
    setAccounts(state, action: PayloadAction<Account[]>) {
      const byId: AccountsById = {};
      const allIds: string[] = [];

      action.payload.forEach(account => {
        byId[account.id] = account;
        allIds.push(account.id);
      });

      state.byId = byId;
      state.allIds = allIds;
    },
    upsertAccount(state, action: PayloadAction<Account>) {
      const account = action.payload;
      state.byId[account.id] = account;
      if (!state.allIds.includes(account.id)) {
        state.allIds.push(account.id);
      }
    },
    removeAccount(state, action: PayloadAction<string>) {
      const accountId = action.payload;
      delete state.byId[accountId];
      state.allIds = state.allIds.filter(id => id !== accountId);
    },
  },
});

export const { setAccounts, upsertAccount, removeAccount } = accountsSlice.actions;

export const accountsReducer = accountsSlice.reducer;
