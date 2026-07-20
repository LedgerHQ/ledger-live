import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { PayCardState } from "./types";

export const payCardInitialState: PayCardState = {
  loginUrl: null,
};

export const payCardSlice = createSlice({
  name: "payCard",
  initialState: payCardInitialState,
  reducers: {
    openPayCard: (state, action: PayloadAction<string>) => {
      state.loginUrl = action.payload;
    },
    closePayCard: state => {
      state.loginUrl = null;
    },
  },
});

export const { openPayCard, closePayCard } = payCardSlice.actions;
