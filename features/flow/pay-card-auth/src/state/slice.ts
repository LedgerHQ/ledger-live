import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { PayCardAuthState } from "./types";

export const payCardAuthInitialState: PayCardAuthState = {
  hasCard: false,
  status: "unknown",
};

export const payCardAuthSlice = createSlice({
  name: "payCardAuth",
  initialState: payCardAuthInitialState,
  reducers: {
    setHasCard: (state, action: PayloadAction<boolean>) => {
      state.hasCard = action.payload;
    },
    /**
     * Written by the login machine, and by `More` once a logout is through. It is runtime
     * state, not a preference, so the slice must stay out of the persisted app state. The boolean
     * maps onto the tri-state: a machine can only report the two resolved outcomes, never `unknown`.
     */
    setSignedIn: (state, action: PayloadAction<boolean>) => {
      state.status = action.payload ? "signedIn" : "signedOut";
    },
  },
});

export const { setHasCard, setSignedIn } = payCardAuthSlice.actions;
