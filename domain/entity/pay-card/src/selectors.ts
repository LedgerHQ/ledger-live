import type {
  PayCardBalanceFilter,
  PayCardParams,
  PayCardPersistedState,
  PayCardState,
} from "./types";

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

export function selectPayCardBalanceFilter(state: PayCardStateRoot): PayCardBalanceFilter {
  return state.payCard.balanceFilter;
}

/** Returns only the persisted subset of the pay card state. */
export function payCardPersistedSelector(state: PayCardStateRoot): PayCardPersistedState {
  return {
    hasSeenFeatureTour: state.payCard.hasSeenFeatureTour,
    balanceFilter: state.payCard.balanceFilter,
  };
}
