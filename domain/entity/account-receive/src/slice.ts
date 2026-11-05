import { createSlice } from "@reduxjs/toolkit";
import { isAccountDataReceived } from "@domain/entity-account-data";
import { initialAccountReceivesState } from "./schema";

export const accountReceivesSlice = createSlice({
  name: "accountReceives",
  initialState: initialAccountReceivesState,
  reducers: {},
  extraReducers: builder => {
    builder.addMatcher(isAccountDataReceived("receive"), (state, { payload }) => {
      state[payload.accountUUID] = payload.data;
    });
  },
});

export default accountReceivesSlice.reducer;
