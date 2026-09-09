import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { PayCardAuthState } from "./types";

export const payCardAuthInitialState: PayCardAuthState = {
  hasCard: false,
  isSignedIn: false,
};

export const payCardAuthSlice = createSlice({
  name: "payCardAuth",
  initialState: payCardAuthInitialState,
  reducers: {
    setHasCard: (state, action: PayloadAction<boolean>) => {
      state.hasCard = action.payload;
    },
    /**
     * Written by the login machine, and by `CardMore` once a logout is through. It is runtime
     * state, not a preference, so the slice must stay out of the persisted app state.
     */
    setSignedIn: (state, action: PayloadAction<boolean>) => {
      state.isSignedIn = action.payload;
    },
  },
});

export const { setHasCard, setSignedIn } = payCardAuthSlice.actions;
