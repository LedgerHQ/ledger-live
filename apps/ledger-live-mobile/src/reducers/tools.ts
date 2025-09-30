import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { State } from "~/reducers/types";

export interface ToolsState {
  rtkDevPanel: boolean;
}

export const INITIAL_STATE: ToolsState = {
  rtkDevPanel: false,
};

export const toolsStateSelector = (state: State) => state.tools;
export const rtkDevPanelSelector = (state: State) => state.tools.rtkDevPanel;

const toolsSlice = createSlice({
  name: "tools",
  initialState: INITIAL_STATE,
  reducers: {
    setRtkDevPanel: (state, action: PayloadAction<boolean>) => {
      state.rtkDevPanel = action.payload;
    },
  },
});

export const { setRtkDevPanel } = toolsSlice.actions;

export default toolsSlice.reducer;
