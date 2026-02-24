import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { AccountV4, AccountsState } from "./schema";
import { loadAccountData } from "../../shared/accountDataActions";

const initialState: AccountsState = {
  byId: {},
  allIds: [],
};

export const accountsSlice = createSlice({
  name: "v4Accounts",
  initialState,
  reducers: {
    setAccounts(state, action: PayloadAction<AccountV4[]>) {
      const byId: Record<string, AccountV4> = {};
      const allIds: string[] = [];
      action.payload.forEach(account => {
        byId[account.id] = account;
        allIds.push(account.id);
      });
      state.byId = byId;
      state.allIds = allIds;
    },
    upsertAccount(state, action: PayloadAction<AccountV4>) {
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
  extraReducers: builder => {
    builder.addCase(loadAccountData.fulfilled, (state, action) => {
      const { accountV4 } = action.payload;
      state.byId[accountV4.id] = accountV4;
      if (!state.allIds.includes(accountV4.id)) {
        state.allIds.push(accountV4.id);
      }
    });
  },
});

export const { setAccounts, upsertAccount, removeAccount } = accountsSlice.actions;
export const accountsReducer = accountsSlice.reducer;
