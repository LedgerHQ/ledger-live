import { createSlice } from "@reduxjs/toolkit";
import { isAccountDataReceived } from "@domain/entity-account-data";
import { initialAccountAddressesState } from "./schema";

export const accountAddressesSlice = createSlice({
  name: "accountAddresses",
  initialState: initialAccountAddressesState,
  reducers: {},
  extraReducers: builder => {
    builder.addMatcher(isAccountDataReceived("address"), (state, { payload }) => {
      state[payload.accountUUID] = payload.data;
    });
  },
});

export default accountAddressesSlice.reducer;
