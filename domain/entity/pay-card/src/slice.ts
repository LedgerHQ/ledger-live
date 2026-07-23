import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { PayCardParams, PayCardPersistedState, PayCardState } from "./types";

export const payCardInitialState: PayCardState = {
  isOpen: false,
  params: null,
  hasSeenFeatureTour: false,
};

export const payCardSlice = createSlice({
  name: "payCard",
  initialState: payCardInitialState,
  reducers: {
    openPayCard: (state, action: PayloadAction<PayCardParams>) => {
      state.isOpen = true;
      state.params = action.payload;
    },
    closePayCard: state => {
      state.isOpen = false;
      state.params = null;
    },
    markPayCardFeatureTourSeen: state => {
      state.hasSeenFeatureTour = true;
    },
    restorePayCardPersistedState: (state, action: PayloadAction<PayCardPersistedState>) => {
      state.hasSeenFeatureTour = action.payload.hasSeenFeatureTour;
    },
  },
});

export const {
  openPayCard,
  closePayCard,
  markPayCardFeatureTourSeen,
  restorePayCardPersistedState,
} = payCardSlice.actions;
