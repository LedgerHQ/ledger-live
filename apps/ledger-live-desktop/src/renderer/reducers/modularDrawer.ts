import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { State } from ".";

export interface ModularDrawerState {
  searchedValue?: string;
  isDebuggingDuplicates: boolean;
  flow: string;
  source: string;
}

const initialState: ModularDrawerState = {
  searchedValue: undefined,
  isDebuggingDuplicates: false,
  flow: "",
  source: "",
};

const modularDrawerSlice = createSlice({
  name: "modularDrawer",
  initialState,
  reducers: {
    setSearchedValue: (state, action: PayloadAction<string | undefined>) => {
      state.searchedValue = action.payload;
    },
    setIsDebuggingDuplicates: (state, action: PayloadAction<boolean>) => {
      state.isDebuggingDuplicates = action.payload;
    },
    resetModularDrawerState: () => initialState,
    setFlowValue: (state, action: PayloadAction<string>) => {
      state.flow = action.payload;
    },
    setSourceValue: (state, action: PayloadAction<string>) => {
      state.source = action.payload;
    },
  },
});

export const modularDrawerStateSelector = (state: State) => state.modularDrawer;

export const modularDrawerSearchedSelector = (state: State) => state.modularDrawer.searchedValue;

export const modularDrawerIsDebuggingDuplicatesSelector = (state: State) =>
  state.modularDrawer.isDebuggingDuplicates;

export const {
  setSearchedValue,
  setIsDebuggingDuplicates,
  resetModularDrawerState,
  setFlowValue,
  setSourceValue,
} = modularDrawerSlice.actions;

export default modularDrawerSlice.reducer;
