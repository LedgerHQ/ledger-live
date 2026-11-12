import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AccountAnalyticsIntroductionState } from "./types";

export const accountAnalyticsIntroductionInitialState: AccountAnalyticsIntroductionState = {
  hasDismissed: false,
  isEligible: null,
};

function isRecord(payload: unknown): payload is Record<string, unknown> {
  return typeof payload === "object" && payload !== null && !Array.isArray(payload);
}

export const accountAnalyticsIntroductionSlice = createSlice({
  name: "accountAnalyticsIntroduction",
  initialState: accountAnalyticsIntroductionInitialState,
  reducers: {
    dismissAccountAnalyticsIntroduction: state => {
      state.hasDismissed = true;
    },
    resetAccountAnalyticsIntroduction: state => {
      state.hasDismissed = false;
    },
    recordAccountAnalyticsIntroductionEligibility: (state, { payload }: PayloadAction<boolean>) => {
      if (state.isEligible !== null) return;
      state.isEligible = payload;
    },
    restoreAccountAnalyticsIntroduction: (state, { payload }: PayloadAction<unknown>) => {
      if (!isRecord(payload)) return;
      if (typeof payload.hasDismissed === "boolean") {
        state.hasDismissed = payload.hasDismissed;
      }
      if (typeof payload.isEligible === "boolean") {
        state.isEligible = payload.isEligible;
      }
    },
  },
});

export const {
  dismissAccountAnalyticsIntroduction,
  resetAccountAnalyticsIntroduction,
  recordAccountAnalyticsIntroductionEligibility,
  restoreAccountAnalyticsIntroduction,
} = accountAnalyticsIntroductionSlice.actions;
