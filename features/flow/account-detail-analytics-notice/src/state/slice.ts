import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AccountAnalyticsIntroductionState } from "./types";

export const accountAnalyticsIntroductionInitialState: AccountAnalyticsIntroductionState = {
  hasDismissed: false,
};

export const accountAnalyticsIntroductionSlice = createSlice({
  name: "accountAnalyticsIntroduction",
  initialState: accountAnalyticsIntroductionInitialState,
  reducers: {
    dismissAccountAnalyticsIntroduction: state => {
      state.hasDismissed = true;
    },
    restoreAccountAnalyticsIntroduction: (state, { payload }: PayloadAction<unknown>) => {
      if (
        typeof payload !== "object" ||
        payload === null ||
        Array.isArray(payload) ||
        !("hasDismissed" in payload)
      ) {
        return;
      }
      if (typeof payload.hasDismissed === "boolean") {
        state.hasDismissed = payload.hasDismissed;
      }
    },
  },
});

export const { dismissAccountAnalyticsIntroduction, restoreAccountAnalyticsIntroduction } =
  accountAnalyticsIntroductionSlice.actions;
