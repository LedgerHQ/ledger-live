import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { State } from ".";

export type ManagerState = {
  /** Set when user requests OS update from banner; reset when drawer opens or update completes/aborts */
  osUpdateRequested: boolean;
};

const initialState: ManagerState = {
  osUpdateRequested: false,
} satisfies ManagerState as ManagerState;

export const managerSlice = createSlice({
  name: "manager",
  initialState,
  reducers: {
    osUpdateRequested: (state, action: PayloadAction<boolean>) => {
      state.osUpdateRequested = action.payload;
    },
  },
});

export const osUpdateRequestedSelector = (state: State): boolean => state.manager.osUpdateRequested;
export const { osUpdateRequested } = managerSlice.actions;
export default managerSlice.reducer;
