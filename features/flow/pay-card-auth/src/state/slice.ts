import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { PayCardAuthorizeAttempt, PayCardAuthState } from "./types";

export const payCardAuthInitialState: PayCardAuthState = {
  hasCard: false,
  authorizeAttempt: null,
};

export const payCardAuthSlice = createSlice({
  name: "payCardAuth",
  initialState: payCardAuthInitialState,
  reducers: {
    setHasCard: (state, action: PayloadAction<boolean>) => {
      state.hasCard = action.payload;
    },
    /**
     * Replaces any attempt still in flight: only the newest login can be completed, so an abandoned
     * one must not stay around to validate a late callback.
     */
    startAuthorizeAttempt: (state, action: PayloadAction<PayCardAuthorizeAttempt>) => {
      state.authorizeAttempt = action.payload;
    },
    /** Called when an attempt ends — completed, failed or cancelled — so no verifier outlives it. */
    clearAuthorizeAttempt: state => {
      state.authorizeAttempt = null;
    },
  },
});

export const { setHasCard, startAuthorizeAttempt, clearAuthorizeAttempt } =
  payCardAuthSlice.actions;
