import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { PayCardParams, PayCardPersistedState, PayCardState } from "./types";

export const payCardInitialState = {
  params: null,
  hasSeenFeatureTour: false,
} satisfies PayCardState as PayCardState;

export const payCardSlice = createSlice({
  name: "payCard",
  initialState: payCardInitialState,
  reducers: {
    openPayCard: (state, action: PayloadAction<PayCardParams>) => {
      state.params = action.payload;
    },
    closePayCard: state => {
      state.params = null;
    },
    markPayCardFeatureTourSeen: state => {
      state.hasSeenFeatureTour = true;
    },
    resetPayCardFeatureTourSeen: state => {
      state.hasSeenFeatureTour = false;
    },
    restorePayCardPersistedState: (
      state,
      action: PayloadAction<Partial<PayCardPersistedState>>,
    ) => {
      const { hasSeenFeatureTour } = action.payload ?? {};
      if (typeof hasSeenFeatureTour === "boolean") {
        state.hasSeenFeatureTour = hasSeenFeatureTour;
      }
    },
  },
});

export const {
  openPayCard,
  closePayCard,
  markPayCardFeatureTourSeen,
  resetPayCardFeatureTourSeen,
  restorePayCardPersistedState,
} = payCardSlice.actions;
