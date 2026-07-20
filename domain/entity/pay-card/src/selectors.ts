import type { PayCardState } from "./types";

type PayCardStateRoot = {
  payCard: PayCardState;
};

export function selectPayCardLoginUrl(state: PayCardStateRoot): string | null {
  return state.payCard.loginUrl;
}
