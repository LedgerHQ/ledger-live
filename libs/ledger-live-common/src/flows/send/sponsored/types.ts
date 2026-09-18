import type { EnergyRentOrder } from "../../../bridge/generic-coin-framework/sponsored";

export const SPONSORED_PHASE = {
  IDLE: "IDLE",
  RENT_SIGNING: "RENT_SIGNING",
  POLLING: "POLLING",
  TRANSFER: "TRANSFER",
  DONE: "DONE",
  FAILED: "FAILED",
} as const;
export type SponsoredPhase = (typeof SPONSORED_PHASE)[keyof typeof SPONSORED_PHASE];

export const SPONSORED_FAILURE_KIND = {
  RENT_PAYMENT: "RENT_PAYMENT",
  // TX A paid but the rented energy never arrived — a poll timeout OR an explicit provider failure.
  // Both are the same user situation (funds moved, contact support, retry re-crafts).
  DELIVERY_FAILED: "DELIVERY_FAILED",
  CONTRACT_DATA: "CONTRACT_DATA",
  TRANSFER: "TRANSFER",
} as const;
export type SponsoredFailureKind =
  (typeof SPONSORED_FAILURE_KIND)[keyof typeof SPONSORED_FAILURE_KIND];

export type SponsoredState = Readonly<{
  phase: SponsoredPhase;
  order: EnergyRentOrder | null;
  // The rent order's payer, captured from the built request at CRAFT_SUCCESS. The delivery poll and
  // the submit-failure reconciliation address the order by it; it belongs to the order, so it is
  // cleared whenever the order is (retry that re-crafts) and re-set by the next CRAFT_SUCCESS.
  payerAddress: string | null;
  paymentTxId: string | null;
  failureKind: SponsoredFailureKind | null;
  failureError: Error | null;
  // Where a CONTRACT_DATA device refusal occurred (rent-signing vs. the post-delivery transfer), so
  // RETRY resumes at the right step. Recorded by the reducer from the live phase at the moment of
  // failure — CONTRACT_DATA_FAILURE only ever dispatches from RENT_SIGNING or TRANSFER.
  contractDataResumePhase: typeof SPONSORED_PHASE.RENT_SIGNING | typeof SPONSORED_PHASE.TRANSFER;
}>;
