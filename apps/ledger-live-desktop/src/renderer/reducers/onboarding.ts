import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { State } from ".";

export interface OnboardingState {
  isOnboardingReceiveFlow: boolean;
  isOnboardingReceiveSuccess: boolean;
}

const initialState: OnboardingState = {
  isOnboardingReceiveFlow: false,
  isOnboardingReceiveSuccess: false,
};

const onboardingSlice = createSlice({
  name: "onboarding",
  initialState,
  reducers: {
    setIsOnboardingReceiveFlow: (
      state,
      action: PayloadAction<{ isFlow: boolean; isSuccess: boolean }>,
    ) => {
      state.isOnboardingReceiveFlow = action.payload.isFlow;
      state.isOnboardingReceiveSuccess = action.payload.isSuccess;
    },
  },
});

export const onboardingReceiveFlowSelector = (state: State) =>
  state.onboarding.isOnboardingReceiveFlow;
export const onboardingReceiveSuccessSelector = (state: State) =>
  state.onboarding.isOnboardingReceiveSuccess;

export const { setIsOnboardingReceiveFlow } = onboardingSlice.actions;

export default onboardingSlice.reducer;
