import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { State } from ".";

interface SyncFlowState {
  seedConfiguration: string;
}
export interface OnboardingState {
  onboardingSyncFlow: null | SyncFlowState;
  isOnboardingReceiveFlow: boolean;
  isOnboardingReceiveSuccess: boolean;
}

/*
 * We have seperate states for checking if is onboarding flow
 * as we want to keep the state pure for specific flows and their dependencies
 */
const initialState: OnboardingState = {
  onboardingSyncFlow: null,
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
    setOnboardingSyncFlow: (state, action: PayloadAction<null | SyncFlowState>) => {
      state.onboardingSyncFlow = action.payload;
    },
  },
});

export const onboardingIsSyncFlowSelector = (state: State) =>
  state.onboarding.onboardingSyncFlow !== null;
export const onboardingSyncFlowSelector = (state: State) => state.onboarding.onboardingSyncFlow;
export const onboardingReceiveFlowSelector = (state: State) =>
  state.onboarding.isOnboardingReceiveFlow;
export const onboardingReceiveSuccessSelector = (state: State) =>
  state.onboarding.isOnboardingReceiveSuccess;

export const { setIsOnboardingReceiveFlow, setOnboardingSyncFlow } = onboardingSlice.actions;

export default onboardingSlice.reducer;
