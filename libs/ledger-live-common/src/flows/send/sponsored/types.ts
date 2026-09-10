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
  paymentTxId: string | null;
  failureKind: SponsoredFailureKind | null;
  failureError: Error | null;
}>;
