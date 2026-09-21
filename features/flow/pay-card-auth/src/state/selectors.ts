import type { PayCardAuthState, PayCardAuthStatus } from "./types";

type PayCardAuthStateRoot = {
  payCardAuth: PayCardAuthState;
};

export function selectPayCardAuth(state: PayCardAuthStateRoot): PayCardAuthState {
  return state.payCardAuth;
}

export function selectHasCard(state: PayCardAuthStateRoot): boolean {
  return state.payCardAuth.hasCard;
}

/**
 * Where the Card session stands. Hosts that must tell "still resolving" from "signed out" read this;
 * everything that only cares whether a session is live reads {@link selectIsSignedIn}.
 */
export function selectCardAuthStatus(state: PayCardAuthStateRoot): PayCardAuthStatus {
  return state.payCardAuth.status;
}

/** True while a Card session is live. `CardLogin` hides on it, and `More` shows on it. */
export function selectIsSignedIn(state: PayCardAuthStateRoot): boolean {
  return state.payCardAuth.status === "signedIn";
}
