import { BigNumber } from "bignumber.js";
import type { RentPayment } from "../../../bridge/generic-coin-framework/sponsored";
import {
  SPONSORED_FAILURE_KIND,
  SPONSORED_ORDER_STATUS,
  SPONSORED_PHASE,
  SPONSORED_SEND_EVENT,
  type SponsoredOrderStatus,
  type SponsoredSendEvent,
  type SponsoredSendTrackingInput,
  type SponsoredState,
} from "./types";

/** The funnel step a state change completes; null for any other change. */
export function getSponsoredSendEvent(
  prev: SponsoredState,
  next: SponsoredState,
): SponsoredSendEvent | null {
  if (next.order && next.order.orderId !== prev.order?.orderId) {
    return SPONSORED_SEND_EVENT.ORDER_CREATED;
  }
  if (next.phase === prev.phase) return null;
  switch (next.phase) {
    // A retry re-enters TRANSFER from FAILED, after the delivery was already counted.
    case SPONSORED_PHASE.TRANSFER:
      return prev.phase === SPONSORED_PHASE.RENT_SIGNING || prev.phase === SPONSORED_PHASE.POLLING
        ? SPONSORED_SEND_EVENT.ENERGY_DELIVERED
        : null;
    case SPONSORED_PHASE.DONE:
      return SPONSORED_SEND_EVENT.SEND_SUCCESS;
    case SPONSORED_PHASE.FAILED:
      return SPONSORED_SEND_EVENT.SEND_FAILED;
    default:
      return null;
  }
}

export function getSponsoredOrderStatus(
  state: Pick<SponsoredState, "order" | "phase" | "failureKind">,
): SponsoredOrderStatus | null {
  if (!state.order) return null;
  switch (state.phase) {
    case SPONSORED_PHASE.POLLING:
      return SPONSORED_ORDER_STATUS.SUBMITTED;
    case SPONSORED_PHASE.TRANSFER:
    case SPONSORED_PHASE.DONE:
      return SPONSORED_ORDER_STATUS.DELIVERED;
    case SPONSORED_PHASE.FAILED:
      return getFailedOrderStatus(state);
    default:
      return SPONSORED_ORDER_STATUS.CREATED;
  }
}

function getFailedOrderStatus(state: Pick<SponsoredState, "failureKind">): SponsoredOrderStatus {
  switch (state.failureKind) {
    case SPONSORED_FAILURE_KIND.DELIVERY_FAILED:
      return SPONSORED_ORDER_STATUS.SUBMITTED;
    case SPONSORED_FAILURE_KIND.TRANSFER:
      return SPONSORED_ORDER_STATUS.DELIVERED;
    case SPONSORED_FAILURE_KIND.RENT_PAYMENT:
    case null:
      return SPONSORED_ORDER_STATUS.CREATED;
  }
}

function toMajorUnits(amount: BigNumber, magnitude: number | undefined): number | null {
  return magnitude === undefined ? null : amount.shiftedBy(-magnitude).toNumber();
}

/** The saving on the fee paid, which an accepted price rise puts above the quote. */
function getSavingsFiat(
  fee: RentPayment | null,
  {
    quotedFee,
    standardFeeFiat,
    sponsoredFeeFiat,
  }: Pick<SponsoredSendTrackingInput, "quotedFee" | "standardFeeFiat" | "sponsoredFeeFiat">,
): BigNumber | null {
  if (!fee || !quotedFee?.amount || !standardFeeFiat || !sponsoredFeeFiat) return null;
  // Paid in the quote's token, so its fiat price scales with the amount.
  const feeFiat = sponsoredFeeFiat.times(fee.amount.toString()).div(quotedFee.amount.toString());
  const savings = standardFeeFiat.minus(feeFiat);
  return savings.gt(0) ? savings : null;
}

export function getSponsoredSendTrackingProperties(
  event: SponsoredSendEvent,
  input: SponsoredSendTrackingInput,
): Record<string, string | number | null> {
  const { state, provider, quotedFee, fiatCurrency } = input;
  const fee = state.rentPayment ?? quotedFee;
  const savingsFiat = getSavingsFiat(fee, input);
  return {
    provider,
    order_status: getSponsoredOrderStatus(state),
    energy_ordered: state.energyNeeded === null ? null : Number(state.energyNeeded),
    fee_amount: fee
      ? toMajorUnits(new BigNumber(fee.amount.toString()), fee.asset.unit?.magnitude)
      : null,
    fee_currency: fee?.asset.unit?.code ?? null,
    savings_fiat: savingsFiat ? toMajorUnits(savingsFiat, fiatCurrency.units[0]?.magnitude) : null,
    fiat_currency: fiatCurrency.ticker,
    ...(event === SPONSORED_SEND_EVENT.SEND_FAILED && {
      failure_kind: state.failureKind,
      error_name: state.failureError?.name ?? null,
    }),
  };
}
