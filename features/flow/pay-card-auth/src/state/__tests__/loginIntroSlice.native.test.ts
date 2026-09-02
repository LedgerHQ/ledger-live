import {
  markPayCardLoginIntroSeen,
  payCardLoginIntroInitialState,
  payCardLoginIntroSlice,
  resetPayCardLoginIntroSeen,
  restorePayCardLoginIntro,
} from "../loginIntroSlice";
import {
  payCardLoginIntroPersistedSelector,
  selectPayCardHasSeenLoginIntro,
} from "../loginIntroSelectors";

const reducer = payCardLoginIntroSlice.reducer;
const root = (state = payCardLoginIntroInitialState) => ({ payCardLoginIntro: state });

describe("payCardLoginIntro slice", () => {
  it("initializes with the intro unseen", () => {
    expect(reducer(undefined, { type: "unknown" })).toEqual(payCardLoginIntroInitialState);
  });

  it("marks the login intro as seen", () => {
    const state = reducer(undefined, markPayCardLoginIntroSeen());
    expect(state.hasSeenLoginIntro).toBe(true);
  });

  it("resets the login intro to unseen", () => {
    const seen = reducer(undefined, markPayCardLoginIntroSeen());
    const state = reducer(seen, resetPayCardLoginIntroSeen());
    expect(state.hasSeenLoginIntro).toBe(false);
  });
});

describe("restorePayCardLoginIntro", () => {
  it("restores hasSeenLoginIntro from a valid payload", () => {
    const state = reducer(undefined, restorePayCardLoginIntro({ hasSeenLoginIntro: true }));
    expect(state.hasSeenLoginIntro).toBe(true);
  });

  it("is a no-op when dispatched with an undefined payload (nothing persisted yet)", () => {
    const state = reducer(undefined, restorePayCardLoginIntro(undefined));
    expect(state).toEqual(payCardLoginIntroInitialState);
  });

  it("ignores non-boolean values", () => {
    const state = reducer(
      undefined,
      // @ts-expect-error - guarding against malformed persisted data
      restorePayCardLoginIntro({ hasSeenLoginIntro: "yes" }),
    );
    expect(state.hasSeenLoginIntro).toBe(false);
  });

  it("leaves a seen flag alone when the blob carries no field of its own", () => {
    const seen = reducer(undefined, markPayCardLoginIntroSeen());
    // The `payCard` blob is shared, so a restore for a neighbour slice reaches this reducer too.
    const state = reducer(seen, restorePayCardLoginIntro({ balanceFilter: "all" } as never));
    expect(state.hasSeenLoginIntro).toBe(true);
  });
});

describe("payCardLoginIntro selectors", () => {
  it("selectPayCardHasSeenLoginIntro reflects mark/reset", () => {
    expect(selectPayCardHasSeenLoginIntro(root())).toBe(false);
    expect(
      selectPayCardHasSeenLoginIntro(root(reducer(undefined, markPayCardLoginIntroSeen()))),
    ).toBe(true);
  });

  it("payCardLoginIntroPersistedSelector returns the whole state", () => {
    const state = reducer(undefined, markPayCardLoginIntroSeen());
    expect(payCardLoginIntroPersistedSelector(root(state))).toEqual({
      hasSeenLoginIntro: true,
    });
  });
});
