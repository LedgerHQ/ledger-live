import {
  payCardAuthSlice,
  payCardAuthInitialState,
  setHasCard,
  setSignedIn,
  selectPayCardAuth,
  selectHasCard,
  selectIsSignedIn,
} from "../slice";

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

  it("initializes signed out", () => {
    expect(payCardAuthInitialState.isSignedIn).toBe(false);
  });

  it("sets isSignedIn", () => {
    const state = reducer(undefined, setSignedIn(true));
    expect(state).toEqual({ ...payCardAuthInitialState, isSignedIn: true });
  });

  it("clears isSignedIn", () => {
    const signedIn = reducer(undefined, setSignedIn(true));
    expect(reducer(signedIn, setSignedIn(false))).toEqual(payCardAuthInitialState);
  });

  it("keeps the two flags apart", () => {
    // `hasCard` says the user owns a card. `isSignedIn` says a session is live. Neither implies
    // the other.
    const state = reducer(reducer(undefined, setHasCard(true)), setSignedIn(false));
    expect(state).toEqual({ hasCard: true, isSignedIn: false });
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

  it("selectIsSignedIn reflects the flag", () => {
    expect(selectIsSignedIn(root())).toBe(false);
    expect(selectIsSignedIn(root(reducer(undefined, setSignedIn(true))))).toBe(true);
  });
});
