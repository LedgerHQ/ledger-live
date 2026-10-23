import {
  hasSeenPredictionsIntroSelector,
  initialPredictionsState,
  markPredictionsIntroSeen,
  predictionsSlice,
  restorePredictionsState,
} from "..";

const reduce = predictionsSlice.reducer;

describe("predictions", () => {
  it("starts with the intro not seen", () => {
    const state = reduce(undefined, { type: "init" });

    expect(hasSeenPredictionsIntroSelector(state)).toBe(false);
  });

  it("remembers that the intro was seen", () => {
    const state = reduce(initialPredictionsState, markPredictionsIntroSeen());

    expect(hasSeenPredictionsIntroSelector(state)).toBe(true);
  });

  it("restores a persisted state", () => {
    const state = reduce(initialPredictionsState, restorePredictionsState({ hasSeenIntro: true }));

    expect(hasSeenPredictionsIntroSelector(state)).toBe(true);
  });

  it.each([null, {}, { hasSeenIntro: "yes" }])(
    "falls back to the initial state when the persisted value is invalid (%p)",
    persisted => {
      const state = reduce({ hasSeenIntro: true }, restorePredictionsState(persisted));

      expect(state).toEqual(initialPredictionsState);
    },
  );
});
