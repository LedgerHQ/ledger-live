import type { PredictionsState } from "./schema";

export const hasSeenPredictionsIntroSelector = (state: PredictionsState): boolean =>
  state.hasSeenIntro;
