import {
  payCardSlice,
  payCardInitialState,
  openPayCard,
  closePayCard,
  markPayCardFeatureTourSeen,
  restorePayCardPersistedState,
} from "./slice";
import {
  selectPayCard,
  selectPayCardIsOpen,
  selectPayCardParams,
  selectPayCardHasSeenFeatureTour,
  payCardPersistedSelector,
} from "./selectors";

const reducer = payCardSlice.reducer;
const params = { platform: "cl-card", name: "CL Card" };
const root = (state = payCardInitialState) => ({ payCard: state });

describe("payCard slice", () => {
  it("initializes closed with no params and tour unseen", () => {
    expect(reducer(undefined, { type: "unknown" })).toEqual(payCardInitialState);
  });

  it("opens with the given params", () => {
    const state = reducer(undefined, openPayCard(params));
    expect(state).toEqual({ ...payCardInitialState, isOpen: true, params });
  });

  it("closes and clears params without touching hasSeenFeatureTour", () => {
    const seen = reducer(undefined, markPayCardFeatureTourSeen());
    const opened = reducer(seen, openPayCard(params));
    expect(reducer(opened, closePayCard())).toEqual({
      ...payCardInitialState,
      hasSeenFeatureTour: true,
    });
  });

  it("marks the feature tour as seen", () => {
    const state = reducer(undefined, markPayCardFeatureTourSeen());
    expect(state.hasSeenFeatureTour).toBe(true);
  });
});

describe("restorePayCardPersistedState", () => {
  it("restores hasSeenFeatureTour from a valid payload", () => {
    const state = reducer(undefined, restorePayCardPersistedState({ hasSeenFeatureTour: true }));
    expect(state.hasSeenFeatureTour).toBe(true);
  });

  it("is a no-op when dispatched with an undefined payload (nothing persisted yet)", () => {
    const state = reducer(
      undefined,
      // @ts-expect-error - simulating a restore with no persisted data
      restorePayCardPersistedState(undefined),
    );
    expect(state).toEqual(payCardInitialState);
  });

  it("ignores non-boolean values", () => {
    const state = reducer(
      undefined,
      // @ts-expect-error - guarding against malformed persisted data
      restorePayCardPersistedState({ hasSeenFeatureTour: "yes" }),
    );
    expect(state.hasSeenFeatureTour).toBe(false);
  });

  it("leaves ephemeral fields untouched", () => {
    const opened = reducer(undefined, openPayCard(params));
    const state = reducer(opened, restorePayCardPersistedState({ hasSeenFeatureTour: true }));
    expect(state.isOpen).toBe(true);
    expect(state.params).toEqual(params);
    expect(state.hasSeenFeatureTour).toBe(true);
  });
});

describe("payCard selectors", () => {
  it("selectPayCard returns the full slice state", () => {
    const state = reducer(undefined, openPayCard(params));
    expect(selectPayCard(root(state))).toEqual(state);
  });

  it("selectPayCardIsOpen reflects open/close", () => {
    expect(selectPayCardIsOpen(root())).toBe(false);
    expect(selectPayCardIsOpen(root(reducer(undefined, openPayCard(params))))).toBe(true);
  });

  it("selectPayCardParams returns params when open, null when closed", () => {
    expect(selectPayCardParams(root())).toBeNull();
    expect(selectPayCardParams(root(reducer(undefined, openPayCard(params))))).toEqual(params);
  });

  it("selectPayCardHasSeenFeatureTour reflects mark/reset", () => {
    expect(selectPayCardHasSeenFeatureTour(root())).toBe(false);
    expect(
      selectPayCardHasSeenFeatureTour(root(reducer(undefined, markPayCardFeatureTourSeen()))),
    ).toBe(true);
  });

  it("payCardPersistedSelector returns only the persisted subset", () => {
    const state = reducer(undefined, openPayCard(params));
    expect(payCardPersistedSelector(root(state))).toEqual({ hasSeenFeatureTour: false });
  });
});
