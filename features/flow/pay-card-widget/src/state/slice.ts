import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  PayCardAnalyticsMilestone,
  PayCardOnboardingWidgetPersistedState,
  PayCardOnboardingWidgetState,
} from "./types";

export const payCardOnboardingWidgetInitialState: PayCardOnboardingWidgetState = {
  hasCompletedOnboarding: false,
  analyticsCardId: null,
  reportedAnalyticsMilestones: [],
  hasReadCardAccount: false,
  digitalWalletProvisioningStartedAt: null,
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
    startDigitalWalletProvisioning: {
      reducer: (state, action: PayloadAction<number>) => {
        state.digitalWalletProvisioningStartedAt = action.payload;
      },
      prepare: () => ({ payload: Date.now() }),
    },
    endDigitalWalletProvisioning: state => {
      state.digitalWalletProvisioningStartedAt = null;
    },
    restorePayCardOnboardingWidget: (
      state,
      action: PayloadAction<Partial<PayCardOnboardingWidgetPersistedState> | undefined>,
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
  startDigitalWalletProvisioning,
  endDigitalWalletProvisioning,
  restorePayCardOnboardingWidget,
} = payCardOnboardingWidgetSlice.actions;
