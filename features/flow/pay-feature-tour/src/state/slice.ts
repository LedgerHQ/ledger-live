import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { PayCardFeatureTourState } from "./types";

export const payCardFeatureTourInitialState: PayCardFeatureTourState = {
  hasSeenFeatureTour: false,
};

export const payCardFeatureTourSlice = createSlice({
  name: "payCardFeatureTour",
  initialState: payCardFeatureTourInitialState,
  reducers: {
    markPayCardFeatureTourSeen: state => {
      state.hasSeenFeatureTour = true;
    },
    resetPayCardFeatureTourSeen: state => {
      state.hasSeenFeatureTour = false;
    },
    restorePayCardFeatureTour: (
      state,
      action: PayloadAction<Partial<PayCardFeatureTourState> | undefined>,
    ) => {
      const { hasSeenFeatureTour } = action.payload ?? {};
      if (typeof hasSeenFeatureTour === "boolean") {
        state.hasSeenFeatureTour = hasSeenFeatureTour;
      }
    },
  },
});

export const {
  markPayCardFeatureTourSeen,
  resetPayCardFeatureTourSeen,
  restorePayCardFeatureTour,
} = payCardFeatureTourSlice.actions;
