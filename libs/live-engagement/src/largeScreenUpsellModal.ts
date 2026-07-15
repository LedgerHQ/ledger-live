import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type LargeScreenUpsellModalState = {
  retries: number;
  lastSeenAt: number | null;
};

export const initialState: LargeScreenUpsellModalState = {
  retries: 0,
  lastSeenAt: null,
};

// Max JS Date timestamp (ECMA-262): ±8.64e15 ms. Values above this yield an Invalid Date.
const MAX_DATE_MS = 8_640_000_000_000_000;

export const isStorableTimestamp = (value: number): boolean =>
  Number.isSafeInteger(value) && value >= 0 && value <= MAX_DATE_MS;

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
        typeof lastSeenAt === "number" && isStorableTimestamp(lastSeenAt)
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
    retriesUpsellModalSelector: state => state.retries,
    lastSeenUpsellModalSelector: state => state.lastSeenAt,
  },
});

export const {
  restoreLargeScreenUpsellModalState,
  recordUpsellModalDisplay,
  resetUpsellModalRetries,
  setUpsellModalRetries,
  setLastSeenUpsellModal,
} = largeScreenUpsellModalSlice.actions;

export const {
  largeScreenUpsellModalSelector,
  retriesUpsellModalSelector,
  lastSeenUpsellModalSelector,
} = largeScreenUpsellModalSlice.selectors;

export const largeScreenUpsellModalReducer = largeScreenUpsellModalSlice.reducer;
