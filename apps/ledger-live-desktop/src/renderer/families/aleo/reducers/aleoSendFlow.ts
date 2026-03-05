import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AMOUNT_NESTED_STEPS } from "~/renderer/families/aleo/constants";
import type { State } from "~/renderer/reducers";

export type AleoSendFlowState = {
  amountNestedStep: AMOUNT_NESTED_STEPS;
};

const initialState: AleoSendFlowState = {
  amountNestedStep: AMOUNT_NESTED_STEPS.PRIVATE_SYNC,
} satisfies AleoSendFlowState;

const aleoSendFlowSlice = createSlice({
  name: "aleoSendFlow",
  initialState,
  reducers: {
    setAmountNestedStep: (state, action: PayloadAction<AMOUNT_NESTED_STEPS>) => {
      state.amountNestedStep = action.payload;
    },
    resetAleoSendFlowState: () => initialState,
  },
});

export const aleoSendFlowAmountNestedStepSelector = (state: State) =>
  state.aleoSendFlow.amountNestedStep;

export const { setAmountNestedStep, resetAleoSendFlowState } = aleoSendFlowSlice.actions;

export default aleoSendFlowSlice.reducer;
