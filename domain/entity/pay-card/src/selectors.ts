import type { PayCardParams, PayCardPersistedState, PayCardState } from "./types";

type PayCardStateRoot = {
  payCard: PayCardState;
};

export function selectPayCard(state: PayCardStateRoot): PayCardState {
  return state.payCard;
}

export function selectPayCardIsOpen(state: PayCardStateRoot): boolean {
  return state.payCard.isOpen;
}

export function selectPayCardParams(state: PayCardStateRoot): PayCardParams | null {
  return state.payCard.params;
}

export function selectPayCardHasSeenFeatureTour(state: PayCardStateRoot): boolean {
  return state.payCard.hasSeenFeatureTour;
}

export function payCardPersistedSelector(state: PayCardStateRoot): PayCardPersistedState {
  return { hasSeenFeatureTour: state.payCard.hasSeenFeatureTour };
}
