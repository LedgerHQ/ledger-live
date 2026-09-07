import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { PayCardOnboardingWidgetState } from "./types";

export const payCardOnboardingWidgetInitialState: PayCardOnboardingWidgetState = {
  hasCompletedOnboarding: false,
  hasAddedCardToWallet: false,
};

export const payCardOnboardingWidgetSlice = createSlice({
  name: "payCardOnboardingWidget",
  initialState: payCardOnboardingWidgetInitialState,
  reducers: {
    markCardOnboardingCompleted: state => {
      state.hasCompletedOnboarding = true;
    },
    resetCardOnboardingCompleted: state => {
      state.hasCompletedOnboarding = false;
    },
    resetCardAddedToWallet: state => {
      state.hasAddedCardToWallet = false;
    },
    markCardAddedToWallet: state => {
      state.hasAddedCardToWallet = true;
    },
    restorePayCardOnboardingWidget: (
      state,
      action: PayloadAction<Partial<PayCardOnboardingWidgetState> | undefined>,
    ) => {
      const { hasCompletedOnboarding, hasAddedCardToWallet } = action.payload ?? {};
      if (typeof hasCompletedOnboarding === "boolean") {
        state.hasCompletedOnboarding = hasCompletedOnboarding;
      }
      if (typeof hasAddedCardToWallet === "boolean") {
        state.hasAddedCardToWallet = hasAddedCardToWallet;
      }
    },
  },
});

export const {
  markCardOnboardingCompleted,
  resetCardOnboardingCompleted,
  markCardAddedToWallet,
  resetCardAddedToWallet,
  restorePayCardOnboardingWidget,
} = payCardOnboardingWidgetSlice.actions;
