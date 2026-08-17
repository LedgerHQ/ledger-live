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

      state.retriesModal = restored.retriesModal;
      state.lastSeenAt = restored.lastSeenAt;
    },
    recordUpsellModalDisplay: {
      reducer: (state, action: PayloadAction<number>) => {
        state.retriesModal += 1;
        state.lastSeenAt = action.payload;
      },
      prepare: (timestamp: number = Date.now()) => ({
        payload: timestamp,
      }),
    },
    /**
     * Undo a display that was recorded but preempted by a competing app-start modal
     * before the user could interact with the upsell.
     */
    rollbackUpsellModalDisplay: (
      state,
      action: PayloadAction<{ previousLastSeenAt: number | null }>,
    ) => {
      if (state.retriesModal > 0) {
        state.retriesModal -= 1;
      }
      const { previousLastSeenAt } = action.payload;
      if (previousLastSeenAt === null) {
        state.lastSeenAt = null;
        return;
      }
      if (isStorableTimestamp(previousLastSeenAt)) {
        state.lastSeenAt = previousLastSeenAt;
      }
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
      state.retriesModal = initialState.retriesModal;
    },
    setUpsellModalRetries: (state, action: PayloadAction<number>) => {
      const retries = action.payload;
      if (Number.isSafeInteger(retries) && retries >= 0) {
        state.retriesModal = retries;
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
      retriesModal: state.retriesModal,
      lastSeenAt: state.lastSeenAt,
    }),
    retriesUpsellModalSelector: state => state.retriesModal,
    lastSeenUpsellModalSelector: state => state.lastSeenAt,
    sessionSelector: state => state.session,
  },
});

export const {
  restoreLargeScreenUpsellModalState,
  recordUpsellModalDisplay,
  rollbackUpsellModalDisplay,
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
