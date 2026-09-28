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
  // Poll timeout or provider failure — same outcome: funds moved, retry re-crafts.
  DELIVERY_FAILED: "DELIVERY_FAILED",
  CONTRACT_DATA: "CONTRACT_DATA",
  TRANSFER: "TRANSFER",
} as const;
export type SponsoredFailureKind =
  (typeof SPONSORED_FAILURE_KIND)[keyof typeof SPONSORED_FAILURE_KIND];

export type SponsoredState = Readonly<{
  phase: SponsoredPhase;
  order: EnergyRentOrder | null;
  // Coupled to order: cleared on retry-recraft, re-set at CRAFT_SUCCESS.
  toSign: string | null;
  reservedNativeAmount: bigint | null;
  payerAddress: string | null;
  // Delivery poll gates TX-C on receiverAddress's on-chain energy reaching energyNeeded.
  receiverAddress: string | null;
  energyNeeded: bigint | null;
  paymentTxId: string | null;
  failureKind: SponsoredFailureKind | null;
  failureError: Error | null;
  // CONTRACT_DATA_FAILURE only dispatches from RENT_SIGNING/TRANSFER; RETRY resumes here.
  contractDataResumePhase: typeof SPONSORED_PHASE.RENT_SIGNING | typeof SPONSORED_PHASE.TRANSFER;
}>;
