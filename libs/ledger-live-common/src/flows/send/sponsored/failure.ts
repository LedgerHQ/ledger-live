import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction } from "../../../generated/types";
import { findFeeTokenAccount, isSponsoredFeeUnaffordable } from "./feeAsset";
import { SPONSORED_FAILURE_KIND, type SponsoredState } from "./types";

export const SPONSORED_FAILURE_MESSAGE = {
  INSUFFICIENT_FUNDS: "insufficientFunds",
  RENT_PAYMENT: "rentPayment",
  DELIVERY_FAILED: "deliveryFailed",
  CONTRACT_DATA: "contractData",
  TRANSFER: "transfer",
} as const;

export type SponsoredFailureMessage =
  (typeof SPONSORED_FAILURE_MESSAGE)[keyof typeof SPONSORED_FAILURE_MESSAGE];

// Matched by name so this coin-agnostic flow imports nothing from coin-tron.
const ENERGY_RENT_INSUFFICIENT_BALANCE = "EnergyRentInsufficientBalance";

const CONTRACT_DATA_DISABLED_STATUS = 0x6a80;

type ContractDataDisabledError = Error & { statusCode: number };

/** The device refused to sign because its app has contract data disabled. */
export function isContractDataDisabledError(error: unknown): error is ContractDataDisabledError {
  return (
    error instanceof Error &&
    error.name === "TransportStatusError" &&
    "statusCode" in error &&
    error.statusCode === CONTRACT_DATA_DISABLED_STATUS
  );
}

export function getSponsoredFailureMessage(
  state: Pick<SponsoredState, "failureKind" | "failureError">,
): SponsoredFailureMessage | null {
  switch (state.failureKind) {
    case null:
      return null;
    case SPONSORED_FAILURE_KIND.RENT_PAYMENT:
      return state.failureError?.name === ENERGY_RENT_INSUFFICIENT_BALANCE
        ? SPONSORED_FAILURE_MESSAGE.INSUFFICIENT_FUNDS
        : SPONSORED_FAILURE_MESSAGE.RENT_PAYMENT;
    case SPONSORED_FAILURE_KIND.DELIVERY_FAILED:
      return SPONSORED_FAILURE_MESSAGE.DELIVERY_FAILED;
    case SPONSORED_FAILURE_KIND.CONTRACT_DATA:
      return SPONSORED_FAILURE_MESSAGE.CONTRACT_DATA;
    case SPONSORED_FAILURE_KIND.TRANSFER:
      return SPONSORED_FAILURE_MESSAGE.TRANSFER;
  }
}

/** Retrying a delivery failure pays a second rent while the first is only a pending reservation,
 * which coin-tron's on-chain balance check can't see; the fee token's pending ops include it.
 * The token account comes from the paid rent: the live quote drops its asset once the option is
 * withdrawn, which would read as unaffordable. */
export function isSponsoredRetryUnaffordable({
  state,
  mainAccount,
  account,
  transaction,
}: Readonly<{
  state: Pick<SponsoredState, "failureKind" | "rentPayment">;
  mainAccount: Account | null;
  account: AccountLike | null | undefined;
  transaction: Transaction | null | undefined;
}>): boolean {
  if (state.failureKind !== SPONSORED_FAILURE_KIND.DELIVERY_FAILED) return false;
  if (!account || !transaction || !state.rentPayment) return false;
  return isSponsoredFeeUnaffordable({
    account,
    transaction,
    feeTokenAccount: findFeeTokenAccount(mainAccount, state.rentPayment.asset),
    rentValue: state.rentPayment.amount,
  });
}

/** The paid rent's ticker, falling back to the live quote's before anything is paid. */
export function getSponsoredFailureFeeTicker(
  state: Pick<SponsoredState, "rentPayment">,
  quoteTicker: string,
): string {
  return state.rentPayment?.asset.unit?.code ?? quoteTicker;
}
