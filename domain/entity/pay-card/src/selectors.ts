import type { PayCardParams } from "./schema";
import type { PayCardState } from "./types";

export function payCardSelector(state: { payCard: PayCardState }): PayCardState {
  return state.payCard;
}

export function selectPayCardIsOpen(state: { payCard: PayCardState }): boolean {
  return state.payCard.isOpen;
}

export function selectPayCardParams(state: { payCard: PayCardState }): PayCardParams | null {
  return state.payCard.params;
}
