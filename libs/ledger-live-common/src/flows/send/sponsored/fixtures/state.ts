import { SPONSORED_PHASE, type SponsoredState } from "../types";

export const IDLE_SPONSORED_STATE: SponsoredState = {
  phase: SPONSORED_PHASE.IDLE,
  order: null,
  toSign: null,
  rentPayment: null,
  payerAddress: null,
  receiverAddress: null,
  energyNeeded: null,
  paymentTxId: null,
  failureKind: null,
  failureError: null,
  rentOrderRejection: null,
  retryLockedUntil: null,
};
