import {
  payCardFeatureTourSlice,
  payCardFeatureTourInitialState,
  markPayCardFeatureTourSeen,
  resetPayCardFeatureTourSeen,
  restorePayCardFeatureTour,
  selectPayCardHasSeenFeatureTour,
  payCardFeatureTourPersistedSelector,
} from "../slice";

const reducer = payCardFeatureTourSlice.reducer;
const root = (state = payCardFeatureTourInitialState) => ({ payCardFeatureTour: state });

describe("payCardFeatureTour slice", () => {
  it("initializes with the tour unseen", () => {
    expect(reducer(undefined, { type: "unknown" })).toEqual(payCardFeatureTourInitialState);
  });

  it("marks the feature tour as seen", () => {
    const state = reducer(undefined, markPayCardFeatureTourSeen());
    expect(state.hasSeenFeatureTour).toBe(true);
  });

  it("resets the feature tour to unseen", () => {
    const seen = reducer(undefined, markPayCardFeatureTourSeen());
    const state = reducer(seen, resetPayCardFeatureTourSeen());
    expect(state.hasSeenFeatureTour).toBe(false);
  });
});

describe("restorePayCardFeatureTour", () => {
  it("restores hasSeenFeatureTour from a valid payload", () => {
    const state = reducer(undefined, restorePayCardFeatureTour({ hasSeenFeatureTour: true }));
    expect(state.hasSeenFeatureTour).toBe(true);
  });

  it("is a no-op when dispatched with an undefined payload (nothing persisted yet)", () => {
    const state = reducer(undefined, restorePayCardFeatureTour(undefined));
    expect(state).toEqual(payCardFeatureTourInitialState);
  });

  it("ignores non-boolean values", () => {
    const state = reducer(
      undefined,
      // @ts-expect-error - guarding against malformed persisted data
      restorePayCardFeatureTour({ hasSeenFeatureTour: "yes" }),
    );
    expect(state.hasSeenFeatureTour).toBe(false);
  });
});

describe("payCardFeatureTour selectors", () => {
  it("selectPayCardHasSeenFeatureTour reflects mark/reset", () => {
    expect(selectPayCardHasSeenFeatureTour(root())).toBe(false);
    expect(
      selectPayCardHasSeenFeatureTour(root(reducer(undefined, markPayCardFeatureTourSeen()))),
    ).toBe(true);
  });

  it("payCardFeatureTourPersistedSelector returns the slice", () => {
    const state = reducer(undefined, markPayCardFeatureTourSeen());
    expect(payCardFeatureTourPersistedSelector(root(state))).toEqual({
      hasSeenFeatureTour: true,
    });
  });
});
