import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { RentPayment } from "../../../bridge/generic-coin-framework/sponsored";
import type { Transaction } from "../../../generated/types";
import { findFeeTokenAccount, formatRentPayment, isSponsoredFeeUnaffordable } from "./feeAsset";
import { SPONSORED_FAILURE_KIND, type SponsoredState } from "./types";

export const SPONSORED_FAILURE_MESSAGE = {
  INSUFFICIENT_FUNDS: "insufficientFunds",
  PRICE_INCREASED: "priceIncreased",
  RENT_PAYMENT: "rentPayment",
  RENT_PAYMENT_REPORTED_FAILED: "rentPaymentReportedFailed",
  DELIVERY_FAILED: "deliveryFailed",
  TRANSFER: "transfer",
} as const;

export type SponsoredFailureMessage =
  (typeof SPONSORED_FAILURE_MESSAGE)[keyof typeof SPONSORED_FAILURE_MESSAGE];

type FailureMessageState = Pick<
  SponsoredState,
  "failureKind" | "rentOrderRejection" | "retryLockedUntil"
>;

function rentPaymentFailureMessage(state: FailureMessageState): SponsoredFailureMessage {
  const sentPaymentMayLand = state.retryLockedUntil !== null;
  if (sentPaymentMayLand) return SPONSORED_FAILURE_MESSAGE.RENT_PAYMENT_REPORTED_FAILED;
  switch (state.rentOrderRejection?.reason) {
    case "insufficientBalance":
      return SPONSORED_FAILURE_MESSAGE.INSUFFICIENT_FUNDS;
    case "priceAboveApproved":
      return SPONSORED_FAILURE_MESSAGE.PRICE_INCREASED;
    default:
      return SPONSORED_FAILURE_MESSAGE.RENT_PAYMENT;
  }
}

export function getSponsoredFailureMessage(
  state: FailureMessageState,
): SponsoredFailureMessage | null {
  switch (state.failureKind) {
    case null:
      return null;
    case SPONSORED_FAILURE_KIND.RENT_PAYMENT:
      return rentPaymentFailureMessage(state);
    case SPONSORED_FAILURE_KIND.DELIVERY_FAILED:
      return SPONSORED_FAILURE_MESSAGE.DELIVERY_FAILED;
    case SPONSORED_FAILURE_KIND.TRANSFER:
      return SPONSORED_FAILURE_MESSAGE.TRANSFER;
  }
}

export function formatSponsoredOfferedFee(
  state: Pick<SponsoredState, "rentOrderRejection">,
  locale: string,
): string | null {
  const rejection = state.rentOrderRejection;
  if (rejection?.reason !== "priceAboveApproved") return null;
  return formatRentPayment(rejection.offered, locale);
}

/** Rounded up to the minute, so the time shown is never one Retry is still locked at. */
export function formatSponsoredRetryTime(retryLockedUntil: number, locale: string): string {
  const minute = 60_000;
  return new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "numeric" }).format(
    new Date(Math.ceil(retryLockedUntil / minute) * minute),
  );
}

type RetryRentState = Pick<SponsoredState, "failureKind" | "rentPayment" | "rentOrderRejection">;

function rentOrderedOnRetry(state: RetryRentState): RentPayment | null {
  switch (state.failureKind) {
    case SPONSORED_FAILURE_KIND.DELIVERY_FAILED:
      return state.rentPayment;
    case SPONSORED_FAILURE_KIND.RENT_PAYMENT:
      return state.rentOrderRejection?.reason === "priceAboveApproved"
        ? state.rentOrderRejection.offered
        : null;
    default:
      return null;
  }
}

/** Retrying a delivery failure pays a second rent while the first is only a pending reservation,
 * which coin-tron's on-chain balance check can't see; the fee token's pending ops include it.
 * Accepting a price rise binds that price for every later Retry, so it must fit before it's
 * offered. The token account comes from the rent's own asset: the live quote drops its asset once
 * the option is withdrawn, which would read as unaffordable. */
export function isSponsoredRetryUnaffordable({
  state,
  mainAccount,
  account,
  transaction,
}: Readonly<{
  state: RetryRentState;
  mainAccount: Account | null;
  account: AccountLike | null | undefined;
  transaction: Transaction | null | undefined;
}>): boolean {
  const rent = rentOrderedOnRetry(state);
  if (!account || !transaction || !rent) return false;
  return isSponsoredFeeUnaffordable({
    account,
    transaction,
    feeTokenAccount: findFeeTokenAccount(mainAccount, rent.asset),
    rentValue: rent.amount,
  });
}

/** The paid rent's ticker, falling back to the live quote's before anything is paid. */
export function getSponsoredFailureFeeTicker(
  state: Pick<SponsoredState, "rentPayment">,
  quoteTicker: string,
): string {
  return state.rentPayment?.asset.unit?.code ?? quoteTicker;
}
