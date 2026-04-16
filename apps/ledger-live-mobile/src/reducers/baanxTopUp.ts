import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { State } from "~/reducers/types";

export interface AgentTopUpEntry {
  agentId: string;
  amount: number;
}

export interface BaanxTopUpState {
  topUpTotal: number;
  pendingAgentTopUps: AgentTopUpEntry[];
}

const INITIAL_STATE: BaanxTopUpState = {
  topUpTotal: 0,
  pendingAgentTopUps: [],
};

const baanxTopUpSlice = createSlice({
  name: "baanxTopUp",
  initialState: INITIAL_STATE,
  reducers: {
    addTopUp: (state, action: PayloadAction<number>) => {
      state.topUpTotal += action.payload;
    },
    resetTopUps: state => {
      state.topUpTotal = 0;
    },
    addAgentTopUp: (state, action: PayloadAction<AgentTopUpEntry>) => {
      state.pendingAgentTopUps.push(action.payload);
    },
    clearPendingAgentTopUps: state => {
      state.pendingAgentTopUps = [];
    },
  },
});

export const { addTopUp, resetTopUps, addAgentTopUp, clearPendingAgentTopUps } =
  baanxTopUpSlice.actions;

export const selectBaanxTopUpTotal = (state: State) => state.baanxTopUp.topUpTotal;
export const selectPendingAgentTopUps = (state: State) => state.baanxTopUp.pendingAgentTopUps;

export default baanxTopUpSlice.reducer;
