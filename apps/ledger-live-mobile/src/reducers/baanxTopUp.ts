import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { State } from "~/reducers/types";

export interface BaanxTopUpState {
  topUpTotal: number;
}

const INITIAL_STATE: BaanxTopUpState = {
  topUpTotal: 0,
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
  },
});

export const { addTopUp, resetTopUps } = baanxTopUpSlice.actions;

export const selectBaanxTopUpTotal = (state: State) => state.baanxTopUp.topUpTotal;

export default baanxTopUpSlice.reducer;
