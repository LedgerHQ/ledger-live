import { initialPredictionsState } from "./schema";
import { markPredictionsIntroSeen, predictionsSlice, restorePredictionsState } from "./slice";

const reduce = predictionsSlice.reducer;
const { selectHasSeenIntro } = predictionsSlice.getSelectors();

describe("predictionsSlice", () => {
  it("starts with the intro not seen", () => {
    const state = reduce(undefined, { type: "init" });

    expect(selectHasSeenIntro(state)).toBe(false);
  });

  it("remembers that the intro was seen", () => {
    const state = reduce(initialPredictionsState, markPredictionsIntroSeen());

    expect(selectHasSeenIntro(state)).toBe(true);
  });

  it("restores a persisted state", () => {
    const state = reduce(initialPredictionsState, restorePredictionsState({ hasSeenIntro: true }));

    expect(selectHasSeenIntro(state)).toBe(true);
  });

  it.each([null, {}, { hasSeenIntro: "yes" }])(
    "falls back to the initial state when the persisted value is invalid (%p)",
    persisted => {
      const state = reduce({ hasSeenIntro: true }, restorePredictionsState(persisted));

      expect(state).toEqual(initialPredictionsState);
    },
  );
});
