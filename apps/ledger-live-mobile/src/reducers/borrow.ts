import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { State } from "~/reducers/types";

export type BorrowInfoBottomSheetState = {
  title: string;
  message: string;
  linkText?: string;
  linkHref?: string;
};

export type BorrowErrorBottomSheetState = {
  title: string;
  description: string;
  ctaLabel: string;
};

export type BorrowState = {
  infoBottomSheet?: BorrowInfoBottomSheetState;
  errorBottomSheet?: BorrowErrorBottomSheetState;
};

export const INITIAL_STATE: BorrowState = {
  infoBottomSheet: undefined,
  errorBottomSheet: undefined,
};

const borrowSlice = createSlice({
  name: "borrow",
  initialState: INITIAL_STATE,
  reducers: {
    setInfoBottomSheet: (state, action: PayloadAction<BorrowInfoBottomSheetState | undefined>) => {
      state.infoBottomSheet = action.payload;
    },
    setErrorBottomSheet: (
      state,
      action: PayloadAction<BorrowErrorBottomSheetState | undefined>,
    ) => {
      state.errorBottomSheet = action.payload;
    },
  },
});

export const { setInfoBottomSheet, setErrorBottomSheet } = borrowSlice.actions;

export const borrowInfoBottomSheetSelector = (state: State) => state.borrow.infoBottomSheet;
export const borrowErrorBottomSheetSelector = (state: State) => state.borrow.errorBottomSheet;

export default borrowSlice.reducer;
