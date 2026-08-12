import type { PayCardAuthorizeAttempt, PayCardAuthState } from "./types";

type PayCardAuthStateRoot = {
  payCardAuth: PayCardAuthState;
};

export function selectPayCardAuth(state: PayCardAuthStateRoot): PayCardAuthState {
  return state.payCardAuth;
}

export function selectHasCard(state: PayCardAuthStateRoot): boolean {
  return state.payCardAuth.hasCard;
}

export function selectAuthorizeAttempt(
  state: PayCardAuthStateRoot,
): PayCardAuthorizeAttempt | null {
  return state.payCardAuth.authorizeAttempt;
}
