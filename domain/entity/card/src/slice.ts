import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CardFlowParams, CardState } from "./types";

export const initialState: CardState = {
  isOpen: false,
  params: null,
};

export const cardSlice = createSlice({
  name: "card",
  initialState,
  reducers: {
    openCardFlow: (state, action: PayloadAction<CardFlowParams>) => {
      state.isOpen = true;
      state.params = action.payload;
    },
    closeCardFlow: state => {
      state.isOpen = false;
      state.params = null;
    },
  },
  selectors: {
    cardFlowSelector: state => state,
    selectCardFlowIsOpen: state => state.isOpen,
    selectCardFlowParams: state => state.params,
  },
});

export const { openCardFlow, closeCardFlow } = cardSlice.actions;
export const { cardFlowSelector, selectCardFlowIsOpen, selectCardFlowParams } = cardSlice.selectors;
