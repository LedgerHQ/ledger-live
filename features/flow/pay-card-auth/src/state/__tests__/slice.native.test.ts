import { payCardAuthSlice, payCardAuthInitialState, setHasCard } from "../slice";
import { selectPayCardAuth, selectHasCard } from "../selectors";

const reducer = payCardAuthSlice.reducer;
const root = (state = payCardAuthInitialState) => ({ payCardAuth: state });

describe("payCardAuth slice", () => {
  it("initializes without a card", () => {
    expect(reducer(undefined, { type: "unknown" })).toEqual(payCardAuthInitialState);
  });

  it("sets hasCard", () => {
    const state = reducer(undefined, setHasCard(true));
    expect(state).toEqual({ ...payCardAuthInitialState, hasCard: true });
  });

  it("clears hasCard", () => {
    const withCard = reducer(undefined, setHasCard(true));
    expect(reducer(withCard, setHasCard(false))).toEqual(payCardAuthInitialState);
  });
});

describe("payCardAuth selectors", () => {
  it("selectPayCardAuth returns the full slice state", () => {
    const state = reducer(undefined, setHasCard(true));
    expect(selectPayCardAuth(root(state))).toEqual(state);
  });

  it("selectHasCard reflects the flag", () => {
    expect(selectHasCard(root())).toBe(false);
    expect(selectHasCard(root(reducer(undefined, setHasCard(true))))).toBe(true);
  });
});
