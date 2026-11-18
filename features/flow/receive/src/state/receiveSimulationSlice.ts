import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ReceiveSimulationState = Readonly<{
  /** Every address the receive screen shows counts as sanctioned, to show its blocked state. */
  isSanctionSimulated: boolean;
}>;

export const receiveSimulationInitialState: ReceiveSimulationState = {
  isSanctionSimulated: false,
};

/** What the DevTools make the receive screen show, for the session: the apps don't persist it. */
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
