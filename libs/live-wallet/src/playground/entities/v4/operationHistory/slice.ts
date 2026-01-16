import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { z } from "zod";

import { OperationHistoryByAccountSchema, OperationSchema } from "./schema";

export type Operation = z.infer<typeof OperationSchema>;
export type OperationHistoryByAccount = z.infer<typeof OperationHistoryByAccountSchema>;

export type OperationHistoryState = {
  readonly byAccountId: OperationHistoryByAccount;
};

const initialState: OperationHistoryState = {
  byAccountId: {},
};

export const operationHistorySlice = createSlice({
  name: "v4OperationHistory",
  initialState,
  reducers: {
    setOperationHistoryForAccount(
      state,
      action: PayloadAction<{ accountId: string; operations: Operation[] }>,
    ) {
      state.byAccountId[action.payload.accountId] = action.payload.operations;
    },
    clearOperationHistoryForAccount(state, action: PayloadAction<string>) {
      delete state.byAccountId[action.payload];
    },
  },
});

export const { setOperationHistoryForAccount, clearOperationHistoryForAccount } =
  operationHistorySlice.actions;

export const operationHistoryReducer = operationHistorySlice.reducer;
