import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { State } from ".";

export interface ModularDrawerState {
  searchedValue?: string;
  flow: string;
  source: string;
}

const initialState: ModularDrawerState = {
  searchedValue: undefined,
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
    setFlowValue: (state, action: PayloadAction<string>) => {
      state.flow = action.payload;
    },
    setSourceValue: (state, action: PayloadAction<string>) => {
      state.source = action.payload;
    },
  },
});

export const modularDrawerSearchedSelector = (state: State) => state.modularDrawer.searchedValue;
export const modularDrawerFlowSelector = (state: State) => state.modularDrawer.flow;
export const modularDrawerSourceSelector = (state: State) => state.modularDrawer.source;

export const { setSearchedValue, setFlowValue, setSourceValue } = modularDrawerSlice.actions;

export default modularDrawerSlice.reducer;
