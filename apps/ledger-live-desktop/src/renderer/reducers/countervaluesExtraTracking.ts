import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { TrackingPair } from "@ledgerhq/live-countervalues/types";
import { pairId } from "@ledgerhq/live-countervalues/helpers";

export type CountervaluesExtraTrackingState = {
  extraTrackingPairs: TrackingPair[];
};

const initialState: CountervaluesExtraTrackingState = {
  extraTrackingPairs: [],
};

const countervaluesExtraTrackingSlice = createSlice({
  name: "countervaluesExtraTracking",
  initialState,
  reducers: {
    addExtraTrackingPairs: (state, action: PayloadAction<TrackingPair[]>) => {
      const incoming = action.payload;
      const existingIds = new Set(state.extraTrackingPairs.map(tp => pairId(tp)));
      for (const pair of incoming) {
        const id = pairId(pair);
        if (!existingIds.has(id)) {
          existingIds.add(id);
          state.extraTrackingPairs.push(pair);
        }
      }
    },
  },
  extraReducers: builder => {
    builder.addCase("COUNTERVALUES_WIPE", () => initialState);
  },
});

export const { addExtraTrackingPairs } = countervaluesExtraTrackingSlice.actions;

export const selectExtraTrackingPairs = (state: {
  countervaluesExtraTracking: CountervaluesExtraTrackingState;
}): TrackingPair[] => state.countervaluesExtraTracking.extraTrackingPairs;

export default countervaluesExtraTrackingSlice.reducer;
