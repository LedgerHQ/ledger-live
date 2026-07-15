import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CardParams, CardState } from "./types";

export const initialState: CardState = {
  isOpen: false,
  params: null,
};

export const cardSlice = createSlice({
  name: "card",
  initialState,
  reducers: {
    openCard: (state, action: PayloadAction<CardParams>) => {
      state.isOpen = true;
      state.params = action.payload;
    },
    closeCard: state => {
      state.isOpen = false;
      state.params = null;
    },
  },
  selectors: {
    cardSelector: state => state,
    selectCardIsOpen: state => state.isOpen,
    selectCardParams: state => state.params,
  },
});

export const { openCard, closeCard } = cardSlice.actions;
export const { cardSelector, selectCardIsOpen, selectCardParams } = cardSlice.selectors;
