import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ReceiveSimulationState = Readonly<{
  isSanctionSimulated: boolean;
}>;

export const receiveSimulationInitialState: ReceiveSimulationState = {
  isSanctionSimulated: false,
};

export const receiveSimulationSlice = createSlice({
  name: "receiveSimulation",
  initialState: receiveSimulationInitialState,
  reducers: {
    setSanctionSimulated: (state, action: PayloadAction<boolean>) => {
      state.isSanctionSimulated = action.payload;
    },
  },
  selectors: {
    selectIsSanctionSimulated: state => state.isSanctionSimulated,
  },
});

export const { setSanctionSimulated } = receiveSimulationSlice.actions;
export const { selectIsSanctionSimulated } = receiveSimulationSlice.selectors;
