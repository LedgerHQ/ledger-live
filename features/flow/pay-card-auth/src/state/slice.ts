import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { PayCardAuthState } from "./types";

export const payCardAuthInitialState: PayCardAuthState = {
  hasCard: false,
};

export const payCardAuthSlice = createSlice({
  name: "payCardAuth",
  initialState: payCardAuthInitialState,
  reducers: {
    setHasCard: (state, action: PayloadAction<boolean>) => {
      state.hasCard = action.payload;
    },
  },
});

export const { setHasCard } = payCardAuthSlice.actions;
