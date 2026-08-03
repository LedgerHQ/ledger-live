import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { LARGE_SCREEN_UPSELL_MODAL } from "./constants";
import {
  defaultLargeScreenUpsellModalState,
  MAX_DATE_MS,
  RestorableLargeScreenUpsellModalStateSchema,
  type RestorableLargeScreenUpsellModalState,
} from "./schema";
import type { LargeScreenUpsellModalState } from "./types";

export const initialState: LargeScreenUpsellModalState = defaultLargeScreenUpsellModalState;

export const isStorableTimestamp = (value: number): boolean =>
  Number.isSafeInteger(value) && value >= 0 && value <= MAX_DATE_MS;

export const largeScreenUpsellModalSlice = createSlice({
  name: LARGE_SCREEN_UPSELL_MODAL,
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
    markDismissed: state => {
      state.session = "dismissed";
    },
    markBlockedByCompeting: state => {
      if (state.session === "ready") {
        state.session = "blockedByCompeting";
      }
    },
    resetUpsellModalRetries: state => {
      state.retries = initialState.retries;
    },
    setUpsellModalRetries: (state, action: PayloadAction<number>) => {
      const retries = action.payload;
      if (Number.isSafeInteger(retries) && retries >= 0) {
        state.retries = retries;
      }
    },
    setLastSeenUpsellModal: (state, action: PayloadAction<number | null>) => {
      const lastSeenAt = action.payload;
      if (lastSeenAt === null) {
        state.lastSeenAt = null;
        return;
      }
      if (isStorableTimestamp(lastSeenAt)) {
        state.lastSeenAt = lastSeenAt;
      }
    },
  },
  selectors: {
    largeScreenUpsellModalSelector: state => state,
    persistedLargeScreenUpsellModalSelector: (state): RestorableLargeScreenUpsellModalState => ({
      retries: state.retries,
      lastSeenAt: state.lastSeenAt,
    }),
    retriesUpsellModalSelector: state => state.retries,
    lastSeenUpsellModalSelector: state => state.lastSeenAt,
    sessionSelector: state => state.session,
  },
});

export const {
  restoreLargeScreenUpsellModalState,
  recordUpsellModalDisplay,
  markDismissed,
  markBlockedByCompeting,
  resetUpsellModalRetries,
  setUpsellModalRetries,
  setLastSeenUpsellModal,
} = largeScreenUpsellModalSlice.actions;

export const {
  largeScreenUpsellModalSelector,
  persistedLargeScreenUpsellModalSelector,
  retriesUpsellModalSelector,
  lastSeenUpsellModalSelector,
  sessionSelector,
} = largeScreenUpsellModalSlice.selectors;
