import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { PayCardProviderAppState } from "./types";

export const payCardProviderAppInitialState: PayCardProviderAppState = {
  providerAppId: null,
};

export const payCardProviderAppSlice = createSlice({
  name: "payCardProviderApp",
  initialState: payCardProviderAppInitialState,
  reducers: {
    /**
     * Written by the login machine, from the redirect the provider answered with. A logout leaves it
     * alone: the logout request still has to reach the tenant that holds the session.
     */
    setPayCardProviderAppId: (state, action: PayloadAction<string | null>) => {
      state.providerAppId = action.payload;
    },
    restorePayCardProviderApp: (
      state,
      action: PayloadAction<Partial<PayCardProviderAppState> | undefined>,
    ) => {
      const { providerAppId } = action.payload ?? {};
      if (typeof providerAppId === "string" || providerAppId === null) {
        state.providerAppId = providerAppId;
      }
    },
  },
});

export const { setPayCardProviderAppId, restorePayCardProviderApp } =
  payCardProviderAppSlice.actions;
