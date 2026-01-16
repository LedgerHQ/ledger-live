import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { z } from "zod";

import { BalanceHistoryByAccountSchema, BalanceHistoryCacheSchema } from "./schema";

export type BalanceHistoryCache = z.infer<typeof BalanceHistoryCacheSchema>;
export type BalanceHistoryByAccount = z.infer<typeof BalanceHistoryByAccountSchema>;

export type BalanceHistoryState = {
  readonly byAccountId: BalanceHistoryByAccount;
};

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
});

export const { setBalanceHistoryForAccount, clearBalanceHistoryForAccount } =
  balanceHistorySlice.actions;

export const balanceHistoryReducer = balanceHistorySlice.reducer;
