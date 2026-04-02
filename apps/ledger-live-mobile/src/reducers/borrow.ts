import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createSelector } from "~/context/selectors";
import type { BorrowState, State } from "./types";

const initialState: BorrowState = {
  infoModal: undefined,
};

const borrowSlice = createSlice({
  name: "borrow",
  initialState,
  reducers: {
    openBorrowInfoModal: (
      state,
      action: PayloadAction<NonNullable<BorrowState["infoModal"]>>,
    ) => {
      state.infoModal = action.payload;
    },
    closeBorrowInfoModal: state => {
      state.infoModal = undefined;
    },
  },
});

export const { openBorrowInfoModal, closeBorrowInfoModal } = borrowSlice.actions;

const storeSelector = (state: State): BorrowState => state.borrow;

export const borrowInfoModalSelector = createSelector(
  storeSelector,
  (state: BorrowState) => state.infoModal,
);

export default borrowSlice.reducer;
