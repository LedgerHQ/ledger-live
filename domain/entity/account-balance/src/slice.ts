import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { isAccountDataReceived } from "@domain/entity-account-data";
import type { AccountUUID } from "@domain/entity-account-descriptor";
import { initialAccountBalancesState } from "./schema";

export const accountBalancesSlice = createSlice({
  name: "accountBalances",
  initialState: initialAccountBalancesState,
  reducers: {
    accountBalancesRemoved: (state, { payload }: PayloadAction<AccountUUID[]>) => {
      for (const accountUUID of payload) delete state[accountUUID];
    },
  },
  extraReducers: builder => {
    builder.addMatcher(isAccountDataReceived("balance"), (state, { payload }) => {
      state[payload.accountUUID] = payload.data;
    });
  },
});

export const { accountBalancesRemoved } = accountBalancesSlice.actions;
