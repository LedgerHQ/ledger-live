import { payCardAuthSlice, payCardAuthInitialState, setHasCard, setSignedIn } from "../slice";
import {
  selectPayCardAuth,
  selectHasCard,
  selectCardAuthStatus,
  selectIsSignedIn,
} from "../selectors";

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

  it("initializes with an unresolved status", () => {
    expect(payCardAuthInitialState.status).toBe("unknown");
  });

  it("maps a signed-in report onto the status", () => {
    const state = reducer(undefined, setSignedIn(true));
    expect(state).toEqual({ ...payCardAuthInitialState, status: "signedIn" });
  });

  it("maps a signed-out report onto the status", () => {
    const signedIn = reducer(undefined, setSignedIn(true));
    expect(reducer(signedIn, setSignedIn(false))).toEqual({
      ...payCardAuthInitialState,
      status: "signedOut",
    });
  });

  it("keeps the card flag and the session status apart", () => {
    // `hasCard` says the user owns a card. The status says where the session stands. Neither
    // implies the other.
    const state = reducer(reducer(undefined, setHasCard(true)), setSignedIn(false));
    expect(state).toEqual({ hasCard: true, status: "signedOut" });
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

  it("selectCardAuthStatus reflects the tri-state", () => {
    expect(selectCardAuthStatus(root())).toBe("unknown");
    expect(selectCardAuthStatus(root(reducer(undefined, setSignedIn(true))))).toBe("signedIn");
    expect(selectCardAuthStatus(root(reducer(undefined, setSignedIn(false))))).toBe("signedOut");
  });

  it("selectIsSignedIn is true only for a live session", () => {
    expect(selectIsSignedIn(root())).toBe(false);
    expect(selectIsSignedIn(root(reducer(undefined, setSignedIn(false))))).toBe(false);
    expect(selectIsSignedIn(root(reducer(undefined, setSignedIn(true))))).toBe(true);
  });
});
