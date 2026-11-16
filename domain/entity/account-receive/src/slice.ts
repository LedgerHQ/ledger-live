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
      const stored = state[accountUUID];
      if (stored && stored.revision > revision) return;
      state[accountUUID] = { revision, receive: data };
    });
  },
});

export default accountReceivesSlice.reducer;
