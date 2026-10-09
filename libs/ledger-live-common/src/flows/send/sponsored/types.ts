import type {
  EnergyRentOrder,
  RentPayment,
} from "../../../bridge/generic-coin-framework/sponsored";

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

/** A fee amount: `value` leads, `secondaryValue` follows dimmed (the crypto amount when `value` is fiat). */
export type FeeAmountDisplay = Readonly<{ value: string; secondaryValue: string | null }>;

/** Each fee option priced in its own unit; only fiat is struck through, as both options share it. */
export type SponsoredFeeAmounts = Readonly<{
  sponsored: FeeAmountDisplay &
    Readonly<{
      /** The standard fee's fiat price, struck through; null unless both fiat prices exist and the sponsored one is lower. */
      originalValue: string | null;
    }>;
  standard: FeeAmountDisplay;
}>;

export type FeePaymentOption = Readonly<{
  id: string;
  label: string;
  paidInLabel: string;
  fee: SponsoredFeeAmounts["sponsored"] | null;
  selected: boolean;
  disabled: boolean;
  /** Why the option can't be picked; null while it can. */
  note: string | null;
}>;

/** The fee payment options' copy, translated by each app. */
export type FeePaymentLabels = Readonly<{
  sponsored: string;
  sponsoredPaidIn: string;
  regular: string;
  regularPaidIn: string;
  /** Why the sponsored option can't be picked. */
  insufficientFunds: string;
}>;

export type SponsoredState = Readonly<{
  phase: SponsoredPhase;
  order: EnergyRentOrder | null;
  // Coupled to order: cleared on retry-recraft, re-set at CRAFT_SUCCESS.
  toSign: string | null;
  rentPayment: RentPayment | null;
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
