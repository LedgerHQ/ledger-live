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
  it("initializes closed, with no params and the tour unseen", () => {
    expect(reducer(undefined, { type: "unknown" })).toEqual(payCardInitialState);
    expect(payCardInitialState.hasSeenFeatureTour).toBe(false);
  });

  it("opens with the given params", () => {
    const state = reducer(undefined, openPayCard(params));
    expect(state).toEqual({ ...payCardInitialState, isOpen: true, params });
  });

  it("closes and clears params", () => {
    const opened = reducer(undefined, openPayCard(params));
    expect(reducer(opened, closePayCard())).toEqual(payCardInitialState);
  });

  it("marks the feature tour as seen without touching isOpen/params", () => {
    const opened = reducer(undefined, openPayCard(params));
    const seen = reducer(opened, markPayCardFeatureTourSeen());
    expect(seen.hasSeenFeatureTour).toBe(true);
    expect(seen.isOpen).toBe(true);
    expect(seen.params).toEqual(params);
  });

  it("restores the persisted subset without clobbering isOpen/params", () => {
    const opened = reducer(undefined, openPayCard(params));
    const restored = reducer(opened, restorePayCardPersistedState({ hasSeenFeatureTour: true }));
    expect(restored.hasSeenFeatureTour).toBe(true);
    expect(restored.isOpen).toBe(true);
    expect(restored.params).toEqual(params);
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

  it("selectPayCardHasSeenFeatureTour reflects the flag", () => {
    expect(selectPayCardHasSeenFeatureTour(root())).toBe(false);
    expect(
      selectPayCardHasSeenFeatureTour(root(reducer(undefined, markPayCardFeatureTourSeen()))),
    ).toBe(true);
  });

  it("payCardPersistedSelector returns only the persisted subset", () => {
    const seen = reducer(undefined, markPayCardFeatureTourSeen());
    expect(payCardPersistedSelector(root(seen))).toEqual({ hasSeenFeatureTour: true });
  });
});
