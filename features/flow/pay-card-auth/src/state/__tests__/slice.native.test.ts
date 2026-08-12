import {
  payCardAuthSlice,
  payCardAuthInitialState,
  setHasCard,
  startAuthorizeAttempt,
  clearAuthorizeAttempt,
} from "../slice";
import { selectPayCardAuth, selectHasCard, selectAuthorizeAttempt } from "../selectors";

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

  it("starts without an authorize attempt", () => {
    expect(payCardAuthInitialState.authorizeAttempt).toBeNull();
  });

  it("stores the state and verifier of an attempt", () => {
    const attempt = { state: "state-value", codeVerifier: "verifier-value" };

    expect(reducer(undefined, startAuthorizeAttempt(attempt)).authorizeAttempt).toEqual(attempt);
  });

  // Only the newest login may complete: a stale verifier must not survive to validate a late callback.
  it("replaces an attempt that is still in flight", () => {
    const first = reducer(undefined, startAuthorizeAttempt({ state: "s1", codeVerifier: "v1" }));
    const second = reducer(first, startAuthorizeAttempt({ state: "s2", codeVerifier: "v2" }));

    expect(second.authorizeAttempt).toEqual({ state: "s2", codeVerifier: "v2" });
  });

  it("drops the attempt when it is cleared, keeping the rest of the slice", () => {
    const started = reducer(
      reducer(undefined, setHasCard(true)),
      startAuthorizeAttempt({ state: "state-value", codeVerifier: "verifier-value" }),
    );

    expect(reducer(started, clearAuthorizeAttempt())).toEqual({
      hasCard: true,
      authorizeAttempt: null,
    });
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

  it("selectAuthorizeAttempt returns the attempt in flight, or null", () => {
    const attempt = { state: "state-value", codeVerifier: "verifier-value" };

    expect(selectAuthorizeAttempt(root())).toBeNull();
    expect(
      selectAuthorizeAttempt(root(reducer(undefined, startAuthorizeAttempt(attempt)))),
    ).toEqual(attempt);
  });
});
