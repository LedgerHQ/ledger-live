import { createSlice } from "@reduxjs/toolkit";

export type ProductTourDrawerState = {
  isOpen: boolean;
};

const initialState: ProductTourDrawerState = {
  isOpen: false,
};

const productTourDrawerSlice = createSlice({
  name: "productTourDrawer",
  initialState,
  reducers: {
    openProductTourDrawer: state => {
      state.isOpen = true;
    },
    closeProductTourDrawer: state => {
      state.isOpen = false;
    },
  },
  selectors: {
    selectIsProductTourDrawerOpen: state => state.isOpen,
  },
});

export const { openProductTourDrawer, closeProductTourDrawer } = productTourDrawerSlice.actions;

export const { selectIsProductTourDrawerOpen } = productTourDrawerSlice.selectors;

export default productTourDrawerSlice.reducer;
