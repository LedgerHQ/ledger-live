import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

/**
 * Origin flow context (e.g. "Stake", "Manager Dashboard", "Ledger Sync", "Send", "Receive").
 * Set when entering a flow; used e.g. for Buy Device modal analytics (trigger).
 * Separate from modularDrawer so it is not reset when the drawer/dialog state is cleared.
 */
export type OriginFlowState = string;

const initialState: OriginFlowState = "";

const originFlowSlice = createSlice({
  name: "originFlow",
  initialState,
  reducers: {
    setOriginFlow: (_, action: PayloadAction<string>) => action.payload,
  },
});

export const { setOriginFlow } = originFlowSlice.actions;
export const selectOriginFlow = (state: { originFlow: OriginFlowState }) => state.originFlow;
export default originFlowSlice.reducer;
