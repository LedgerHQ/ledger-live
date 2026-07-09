import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type LargeScreenUpsellModalState = {
  retries: number;
  lastSeenAt: number | null;
};

export const initialState: LargeScreenUpsellModalState = {
  retries: 0,
  lastSeenAt: null,
};

const largeScreenUpsellModalSlice = createSlice({
  name: "largeScreenUpsellModal",
  initialState,
  reducers: {
    restoreLargeScreenUpsellModalState: (
      state,
      action: PayloadAction<Partial<LargeScreenUpsellModalState>>,
    ) => {
      const { retries, lastSeenAt } = action.payload;
      const isRestorableRetryCount =
        typeof retries === "number" && Number.isSafeInteger(retries) && retries >= 0;

      state.retries = isRestorableRetryCount ? retries : initialState.retries;
      state.lastSeenAt =
        typeof lastSeenAt === "number" && Number.isSafeInteger(lastSeenAt) && lastSeenAt >= 0
          ? lastSeenAt
          : initialState.lastSeenAt;
    },
    recordUpsellModalDisplay: {
      reducer: (state, action: PayloadAction<number>) => {
        state.retries += 1;
        state.lastSeenAt = action.payload;
      },
      prepare: (timestamp = Date.now()) => ({
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

export const largeScreenUpsellModalReducer = largeScreenUpsellModalSlice.reducer;
