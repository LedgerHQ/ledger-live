import type { PayCardAuthState } from "./types";

type PayCardAuthStateRoot = {
  payCardAuth: PayCardAuthState;
};

export function selectPayCardAuth(state: PayCardAuthStateRoot): PayCardAuthState {
  return state.payCardAuth;
}

export function selectHasCard(state: PayCardAuthStateRoot): boolean {
  return state.payCardAuth.hasCard;
}

/** True while a Card session is live. `CardLogin` hides on it, and `CardMore` shows on it. */
export function selectIsSignedIn(state: PayCardAuthStateRoot): boolean {
  return state.payCardAuth.isSignedIn;
}
