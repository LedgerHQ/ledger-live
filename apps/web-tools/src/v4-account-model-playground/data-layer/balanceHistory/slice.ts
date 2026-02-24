import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { BalanceHistoryCache } from "@ledgerhq/types-live";
import type { BalanceHistoryState } from "./schema";
import { loadAccountData } from "../../shared/accountDataActions";

const initialState: BalanceHistoryState = {
  byAccountId: {},
};

export const balanceHistorySlice = createSlice({
  name: "v4BalanceHistory",
  initialState,
  reducers: {
    setBalanceHistoryForAccount(
      state,
      action: PayloadAction<{ accountId: string; history: BalanceHistoryCache }>,
    ) {
      state.byAccountId[action.payload.accountId] = action.payload.history;
    },
    clearBalanceHistoryForAccount(state, action: PayloadAction<string>) {
      delete state.byAccountId[action.payload];
    },
  },
  extraReducers: builder => {
    builder.addCase(loadAccountData.fulfilled, (state, action) => {
      const { accountV4, balanceHistory } = action.payload;
      state.byAccountId[accountV4.id] = balanceHistory;
    });
  },
});

export const { setBalanceHistoryForAccount, clearBalanceHistoryForAccount } =
  balanceHistorySlice.actions;
export const balanceHistoryReducer = balanceHistorySlice.reducer;
