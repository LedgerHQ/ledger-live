import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { PayCardAuthState } from "./types";

export const payCardAuthInitialState: PayCardAuthState = {
  hasCard: false,
  pendingLoginType: null,
  status: "unknown",
  isSessionResolving: false,
};

export const payCardAuthSlice = createSlice({
  name: "payCardAuth",
  initialState: payCardAuthInitialState,
  reducers: {
    setHasCard: (state, action: PayloadAction<boolean>) => {
      state.hasCard = action.payload;
    },
    setPendingLoginType: (state, action: PayloadAction<PayCardAuthState["pendingLoginType"]>) => {
      state.pendingLoginType = action.payload;
    },
    /**
     * Written by the login machine, and by `More` once a logout is through. It is runtime
     * state, not a preference, so the slice must stay out of the persisted app state. The boolean
     * maps onto the tri-state: a machine can only report the two resolved outcomes, never `unknown`.
     */
    setSignedIn: (state, action: PayloadAction<boolean>) => {
      state.status = action.payload ? "signedIn" : "signedOut";
    },
    setSessionResolving: (state, action: PayloadAction<boolean>) => {
      state.isSessionResolving = action.payload;
    },
  },
});

export const { setHasCard, setPendingLoginType, setSessionResolving, setSignedIn } =
  payCardAuthSlice.actions;
