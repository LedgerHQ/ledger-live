import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { z } from "zod";

import { SwapHistoryByAccountSchema, SwapOperationSchema } from "./schema";

export type SwapOperation = z.infer<typeof SwapOperationSchema>;
export type SwapHistoryByAccount = z.infer<typeof SwapHistoryByAccountSchema>;

export type SwapHistoryState = {
  readonly byAccountId: SwapHistoryByAccount;
};

const initialState: SwapHistoryState = {
  byAccountId: {},
};

export const swapHistorySlice = createSlice({
  name: "v4SwapHistory",
  initialState,
  reducers: {
    setSwapHistoryForAccount(
      state,
      action: PayloadAction<{ accountId: string; swaps: SwapOperation[] }>,
    ) {
      state.byAccountId[action.payload.accountId] = action.payload.swaps;
    },
    clearSwapHistoryForAccount(state, action: PayloadAction<string>) {
      delete state.byAccountId[action.payload];
    },
  },
});

export const { setSwapHistoryForAccount, clearSwapHistoryForAccount } =
  swapHistorySlice.actions;

export const swapHistoryReducer = swapHistorySlice.reducer;
