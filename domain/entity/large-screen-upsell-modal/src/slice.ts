import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  defaultLargeScreenUpsellModalState,
  RestorableLargeScreenUpsellModalStateSchema,
} from "./schema";
import type { LargeScreenUpsellModalState } from "./types";

export const initialState: LargeScreenUpsellModalState = defaultLargeScreenUpsellModalState;

export const largeScreenUpsellModalSlice = createSlice({
  name: "largeScreenUpsellModal",
  initialState,
  reducers: {
    restoreLargeScreenUpsellModalState: (
      state,
      action: PayloadAction<Partial<LargeScreenUpsellModalState>>,
    ) => {
      const restored = RestorableLargeScreenUpsellModalStateSchema.parse(action.payload);

      state.retries = restored.retries;
      state.lastSeenAt = restored.lastSeenAt;
    },
    recordUpsellModalDisplay: {
      reducer: (state, action: PayloadAction<number>) => {
        state.retries += 1;
        state.lastSeenAt = action.payload;
      },
      prepare: (timestamp: number = Date.now()) => ({
        payload: timestamp,
      }),
    },
    resetUpsellModalRetries: state => {
      state.retries = initialState.retries;
    },
  },
  selectors: {
    largeScreenUpsellModalSelector: state => state,
    retriesUpsellModalSelector: state => state.retries,
    lastSeenUpsellModalSelector: state => state.lastSeenAt,
  },
});

export const {
  restoreLargeScreenUpsellModalState,
  recordUpsellModalDisplay,
  resetUpsellModalRetries,
} = largeScreenUpsellModalSlice.actions;

export const {
  largeScreenUpsellModalSelector,
  retriesUpsellModalSelector,
  lastSeenUpsellModalSelector,
} = largeScreenUpsellModalSlice.selectors;
