/**
 * TEMPORARY PLACEHOLDER slice for all coin-specific resources in one store.
 * See schema.ts and README.
 */
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { AccountCoinResourcesState, AccountCoinResources } from "./schema";
import { loadAccountData } from "../../shared/accountDataActions";

const initialState: AccountCoinResourcesState = {
  byAccountId: {},
};

export const accountCoinResourcesSlice = createSlice({
  name: "v4AccountCoinResources",
  initialState,
  reducers: {
    setAccountCoinResources(
      state,
      action: PayloadAction<{ accountId: string; resources: AccountCoinResources }>,
    ) {
      state.byAccountId[action.payload.accountId] = action.payload.resources;
    },
    clearAccountCoinResources(state, action: PayloadAction<string>) {
      delete state.byAccountId[action.payload];
    },
  },
  extraReducers: builder => {
    builder.addCase(loadAccountData.fulfilled, (state, action) => {
      const { accountV4, accountCoinResources } = action.payload;
      state.byAccountId[accountV4.id] = accountCoinResources;
    });
  },
});

export const { setAccountCoinResources, clearAccountCoinResources } =
  accountCoinResourcesSlice.actions;
export const accountCoinResourcesReducer = accountCoinResourcesSlice.reducer;
