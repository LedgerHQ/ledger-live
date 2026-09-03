import type { PayCardLoginIntroState } from "./types";

type PayCardLoginIntroStateRoot = {
  payCardLoginIntro: PayCardLoginIntroState;
};

export function selectPayCardHasSeenLoginIntro(state: PayCardLoginIntroStateRoot): boolean {
  return state.payCardLoginIntro.hasSeenLoginIntro;
}

export function payCardLoginIntroPersistedSelector(
  state: PayCardLoginIntroStateRoot,
): PayCardLoginIntroState {
  return {
    hasSeenLoginIntro: state.payCardLoginIntro.hasSeenLoginIntro,
  };
}
