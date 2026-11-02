import { createSlice } from "@reduxjs/toolkit";
import { isAccountDataReceived } from "@domain/entity-account-data";
import { initialAccountBalanceHistoriesState } from "./schema";

export const accountBalanceHistoriesSlice = createSlice({
  name: "accountBalanceHistories",
  initialState: initialAccountBalanceHistoriesState,
  reducers: {},
  extraReducers: builder => {
    builder.addMatcher(isAccountDataReceived("balanceHistory"), (state, { payload }) => {
      const { accountUUID, data } = payload;
      state[accountUUID] = { ...state[accountUUID], [data.range]: data.series };
    });
  },
});

export default accountBalanceHistoriesSlice.reducer;
