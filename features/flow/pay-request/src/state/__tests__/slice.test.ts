import {
  payRequestVerifyHintSlice,
  payRequestVerifyHintInitialState,
  markReceiveVerifyHintSeen,
  resetReceiveVerifyHintSeen,
  restoreReceiveVerifyHint,
  selectHasSeenReceiveVerifyHint,
  payRequestVerifyHintPersistedSelector,
} from "../slice";

const reducer = payRequestVerifyHintSlice.reducer;
const root = (state = payRequestVerifyHintInitialState) => ({ payRequestVerifyHint: state });

describe("payRequestVerifyHint slice", () => {
  it("initializes with the hint unseen", () => {
    expect(reducer(undefined, { type: "unknown" })).toEqual(payRequestVerifyHintInitialState);
  });

  it("marks the receive verify hint as seen", () => {
    const state = reducer(undefined, markReceiveVerifyHintSeen());
    expect(state.hasSeenReceiveVerifyHint).toBe(true);
  });

  it("resets the receive verify hint to unseen", () => {
    const seen = reducer(undefined, markReceiveVerifyHintSeen());
    const state = reducer(seen, resetReceiveVerifyHintSeen());
    expect(state.hasSeenReceiveVerifyHint).toBe(false);
  });
});

describe("restoreReceiveVerifyHint", () => {
  it("restores hasSeenReceiveVerifyHint from a valid payload", () => {
    const state = reducer(undefined, restoreReceiveVerifyHint({ hasSeenReceiveVerifyHint: true }));
    expect(state.hasSeenReceiveVerifyHint).toBe(true);
  });

  it("is a no-op when dispatched with an undefined payload", () => {
    const state = reducer(undefined, restoreReceiveVerifyHint(undefined));
    expect(state).toEqual(payRequestVerifyHintInitialState);
  });

  it("ignores non-boolean values", () => {
    const state = reducer(
      undefined,
      // @ts-expect-error - guarding against malformed persisted data
      restoreReceiveVerifyHint({ hasSeenReceiveVerifyHint: "yes" }),
    );
    expect(state.hasSeenReceiveVerifyHint).toBe(false);
  });
});

describe("payRequestVerifyHint selectors", () => {
  it("selectHasSeenReceiveVerifyHint reflects mark/reset", () => {
    expect(selectHasSeenReceiveVerifyHint(root())).toBe(false);
    expect(
      selectHasSeenReceiveVerifyHint(root(reducer(undefined, markReceiveVerifyHintSeen()))),
    ).toBe(true);
  });

  it("payRequestVerifyHintPersistedSelector returns the slice", () => {
    const state = reducer(undefined, markReceiveVerifyHintSeen());
    expect(payRequestVerifyHintPersistedSelector(root(state))).toEqual({
      hasSeenReceiveVerifyHint: true,
    });
  });
});
