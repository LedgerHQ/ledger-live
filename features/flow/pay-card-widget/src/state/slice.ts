import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { PayCardAnalyticsMilestone, PayCardOnboardingWidgetState } from "./types";

export const payCardOnboardingWidgetInitialState: PayCardOnboardingWidgetState = {
  hasCompletedOnboarding: false,
  analyticsCardId: null,
  reportedAnalyticsMilestones: [],
  hasReadCardAccount: false,
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
    setAnalyticsCardId: (state, action: PayloadAction<string>) => {
      if (state.analyticsCardId === action.payload) return;

      if (state.analyticsCardId !== null) {
        state.hasReadCardAccount = false;
      }
      state.analyticsCardId = action.payload;
      state.reportedAnalyticsMilestones = [];
    },
    markCardAccountRead: state => {
      state.hasReadCardAccount = true;
    },
    markAnalyticsMilestonesReported: (
      state,
      action: PayloadAction<readonly PayCardAnalyticsMilestone[]>,
    ) => {
      for (const milestone of action.payload) {
        if (!state.reportedAnalyticsMilestones.includes(milestone)) {
          state.reportedAnalyticsMilestones.push(milestone);
        }
      }
    },
    restorePayCardOnboardingWidget: (
      state,
      action: PayloadAction<Partial<PayCardOnboardingWidgetState> | undefined>,
    ) => {
      const {
        hasCompletedOnboarding,
        analyticsCardId,
        reportedAnalyticsMilestones,
        hasReadCardAccount,
      } = action.payload ?? {};
      if (typeof hasCompletedOnboarding === "boolean") {
        state.hasCompletedOnboarding = hasCompletedOnboarding;
      }
      if (typeof hasReadCardAccount === "boolean") {
        state.hasReadCardAccount = hasReadCardAccount;
      }
      if (typeof analyticsCardId === "string") {
        state.analyticsCardId = analyticsCardId;
      }
      if (Array.isArray(reportedAnalyticsMilestones)) {
        state.reportedAnalyticsMilestones = reportedAnalyticsMilestones;
      }
    },
  },
});

export const {
  markCardOnboardingCompleted,
  resetCardOnboardingCompleted,
  setAnalyticsCardId,
  markCardAccountRead,
  markAnalyticsMilestonesReported,
  restorePayCardOnboardingWidget,
} = payCardOnboardingWidgetSlice.actions;
