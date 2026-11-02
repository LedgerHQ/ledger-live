import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { initialPredictionsState, PredictionsStateSchema } from "./schema";

export const predictionsSlice = createSlice({
  name: "predictions",
  initialState: initialPredictionsState,
  reducers: {
    markPredictionsIntroSeen: state => {
      state.hasSeenIntro = true;
    },
    // The persisted value comes from disk, so it is parsed rather than trusted.
    restorePredictionsState: (_state, { payload }: PayloadAction<unknown>) => {
      const restored = PredictionsStateSchema.safeParse(payload);
      return restored.success ? restored.data : initialPredictionsState;
    },
  },
  selectors: {
    selectHasSeenIntro: (state): boolean => state.hasSeenIntro,
  },
});

export const { markPredictionsIntroSeen, restorePredictionsState } = predictionsSlice.actions;
export const { selectHasSeenIntro } = predictionsSlice.selectors;
