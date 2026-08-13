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
