import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { State } from ".";

export interface ModularDrawerState {
  searchedValue?: string;
}

const initialState: ModularDrawerState = {
  searchedValue: undefined,
};

const modularDrawerSlice = createSlice({
  name: "modularDrawer",
  initialState,
  reducers: {
    setSearchedValue: (state, action: PayloadAction<string | undefined>) => {
      state.searchedValue = action.payload;
    },
  },
});

export const modularDrawerStateSelector = (state: State) => state.modularDrawer;

export const modularDrawerSearchedSelector = (state: State) => state.modularDrawer.searchedValue;

export const { setSearchedValue } = modularDrawerSlice.actions;

export default modularDrawerSlice.reducer;
