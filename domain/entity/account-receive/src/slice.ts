import { createSlice } from "@reduxjs/toolkit";
import { isAccountDataReceived } from "@domain/entity-account-data";
import { initialAccountReceivesState } from "./schema";

export const accountReceivesSlice = createSlice({
  name: "accountReceives",
  initialState: initialAccountReceivesState,
  reducers: {},
  extraReducers: builder => {
    builder.addMatcher(isAccountDataReceived("receive"), (state, { payload }) => {
      const { accountUUID, data, revision } = payload;
      // Two queries may answer one asset (no asset reads the native coin): the older answer never wins.
      const stored = state[accountUUID]?.[data.assetId];
      if (stored && stored.revision > revision) return;
      state[accountUUID] = {
        ...state[accountUUID],
        [data.assetId]: { revision, receive: data.receive },
      };
    });
  },
});

export default accountReceivesSlice.reducer;
