import type { PayCardFeatureTourState } from "./types";

type PayCardFeatureTourStateRoot = {
  payCardFeatureTour: PayCardFeatureTourState;
};

export function selectPayCardHasSeenFeatureTour(state: PayCardFeatureTourStateRoot): boolean {
  return state.payCardFeatureTour.hasSeenFeatureTour;
}

/** Returns the persisted pay card feature tour state (its whole state is persisted). */
export function payCardFeatureTourPersistedSelector(
  state: PayCardFeatureTourStateRoot,
): PayCardFeatureTourState {
  return {
    hasSeenFeatureTour: state.payCardFeatureTour.hasSeenFeatureTour,
  };
}
