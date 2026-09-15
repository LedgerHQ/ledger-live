import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { State } from "~/reducers/types";

export type CurrencyRegionRestrictedDrawerState = {
  isOpen: boolean;
  currencyName: string | null;
};

export const INITIAL_STATE: CurrencyRegionRestrictedDrawerState = {
  isOpen: false,
  currencyName: null,
};

export const selectIsCurrencyRegionRestrictedDrawerOpen = (state: State) =>
  state.currencyRegionRestrictedDrawer.isOpen;
export const selectCurrencyRegionRestrictedDrawerCurrencyName = (state: State) =>
  state.currencyRegionRestrictedDrawer.currencyName;

const currencyRegionRestrictedDrawerSlice = createSlice({
  name: "currencyRegionRestrictedDrawer",
  initialState: INITIAL_STATE,
  reducers: {
    openCurrencyRegionRestrictedDrawer: (state, action: PayloadAction<string>) => {
      state.isOpen = true;
      state.currencyName = action.payload;
    },
    closeCurrencyRegionRestrictedDrawer: state => {
      state.isOpen = false;
      state.currencyName = null;
    },
  },
});

export const { openCurrencyRegionRestrictedDrawer, closeCurrencyRegionRestrictedDrawer } =
  currencyRegionRestrictedDrawerSlice.actions;

export default currencyRegionRestrictedDrawerSlice.reducer;
