import type { BigNumber } from "bignumber.js";
import type { Currency } from "@domain/entity-currency";
import type {
  EnergyRentOrder,
  RentOrderRejection,
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
  TRANSFER: "TRANSFER",
} as const;
export type SponsoredFailureKind =
  (typeof SPONSORED_FAILURE_KIND)[keyof typeof SPONSORED_FAILURE_KIND];

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
  /** Why the rent order failed, when the flow can tell the user. */
  rentOrderRejection: RentOrderRejection | null;
  /** Retry stays off until then, in ms since epoch: a payment we sent may still land. */
  retryLockedUntil: number | null;
}>;

export const SPONSORED_SEND_EVENT = {
  ORDER_CREATED: "gas_sponsorship_order_created",
  ENERGY_DELIVERED: "gas_sponsorship_energy_delivered",
  SEND_SUCCESS: "gas_sponsorship_send_success",
  SEND_FAILED: "gas_sponsorship_send_failed",
} as const;
export type SponsoredSendEvent = (typeof SPONSORED_SEND_EVENT)[keyof typeof SPONSORED_SEND_EVENT];

/** What is known of the rent order. `submitted`: TX-A reached the provider, delivery unconfirmed. */
export const SPONSORED_ORDER_STATUS = {
  CREATED: "created",
  SUBMITTED: "submitted",
  DELIVERED: "delivered",
} as const;
export type SponsoredOrderStatus =
  (typeof SPONSORED_ORDER_STATUS)[keyof typeof SPONSORED_ORDER_STATUS];

export type SponsoredSendTrackingInput = Readonly<{
  state: SponsoredState;
  /** The sponsored fee option's id; null once the option is gone. */
  provider: string | null;
  /** The live quote's fee, reported until an order fixes the rent. */
  quotedFee: RentPayment | null;
  /** The quote's standard and sponsored fees, in `fiatCurrency` base units; null when unpriced. */
  standardFeeFiat: BigNumber | null;
  sponsoredFeeFiat: BigNumber | null;
  fiatCurrency: Currency;
}>;
