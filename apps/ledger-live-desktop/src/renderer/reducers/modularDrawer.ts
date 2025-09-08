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

export const modularDrawerStateSelector = (state: State) => state.modularDrawer;

export const { setSearchedValue, setFlowValue, setSourceValue } = modularDrawerSlice.actions;

export default modularDrawerSlice.reducer;
