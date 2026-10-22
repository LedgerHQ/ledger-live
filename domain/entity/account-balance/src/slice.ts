import { createSlice } from "@reduxjs/toolkit";
import { isAccountDataReceived } from "@domain/entity-account-data";
import { initialAccountBalancesState } from "./schema";

export const accountBalancesSlice = createSlice({
  name: "accountBalances",
  initialState: initialAccountBalancesState,
  reducers: {},
  extraReducers: builder => {
    builder.addMatcher(isAccountDataReceived("balance"), (state, { payload }) => {
      state[payload.accountUUID] = payload.data;
    });
  },
});
