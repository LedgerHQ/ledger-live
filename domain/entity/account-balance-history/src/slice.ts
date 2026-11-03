import { createSlice } from "@reduxjs/toolkit";
import { isAccountDataReceived } from "@domain/entity-account-data";
import { initialAccountBalanceHistoriesState } from "./schema";

export const accountBalanceHistoriesSlice = createSlice({
  name: "accountBalanceHistories",
  initialState: initialAccountBalanceHistoriesState,
  reducers: {},
  extraReducers: builder => {
    builder.addMatcher(isAccountDataReceived("balanceHistory"), (state, { payload }) => {
      const { accountUUID, data, revision } = payload;
      // Two queries may answer one range (no range reads the default one): the older answer never wins.
      const stored = state[accountUUID]?.[data.range];
      if (stored && stored.revision > revision) return;
      state[accountUUID] = {
        ...state[accountUUID],
        [data.range]: { revision, series: data.series },
      };
    });
  },
});

export default accountBalanceHistoriesSlice.reducer;
