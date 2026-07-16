import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { PayCardParams } from "./schema";
import type { PayCardState } from "./types";

export const initialState: PayCardState = {
  isOpen: false,
  params: null,
};

export const payCardSlice = createSlice({
  name: "payCard",
  initialState,
  reducers: {
    openPayCard: (state, action: PayloadAction<PayCardParams>) => {
      state.isOpen = true;
      state.params = action.payload;
    },
    closePayCard: state => {
      state.isOpen = false;
      state.params = null;
    },
  },
});

export const { openPayCard, closePayCard } = payCardSlice.actions;
