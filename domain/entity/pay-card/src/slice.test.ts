import { payCardSlice, payCardInitialState, openPayCard, closePayCard } from "./slice";
import { selectPayCard, selectPayCardIsOpen, selectPayCardParams } from "./selectors";

const reducer = payCardSlice.reducer;
const params = { platform: "cl-card", name: "CL Card" };
const root = (state = payCardInitialState) => ({ payCard: state });

describe("payCard slice", () => {
  it("initializes closed with no params", () => {
    expect(reducer(undefined, { type: "unknown" })).toEqual(payCardInitialState);
  });

  it("opens with the given params", () => {
    const state = reducer(undefined, openPayCard(params));
    expect(state).toEqual({ isOpen: true, params });
  });

  it("closes and clears params", () => {
    const opened = reducer(undefined, openPayCard(params));
    expect(reducer(opened, closePayCard())).toEqual(payCardInitialState);
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
});
