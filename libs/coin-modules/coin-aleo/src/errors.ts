import { createCustomErrorClass } from "@ledgerhq/errors";

export const AleoAmountRecordRequired = createCustomErrorClass("AleoAmountRecordRequired");
export const AleoFeeRecordRequired = createCustomErrorClass("AleoFeeRecordRequired");
export const AleoTwoRecordsRequired = createCustomErrorClass("AleoTwoRecordsRequired");
export const AleoFeeRecordInsufficientBalance = createCustomErrorClass(
  "AleoFeeRecordInsufficientBalance",
);
export const AleoApiConfigurationResetError = createCustomErrorClass(
  "AleoApiConfigurationResetError",
);
export const AleoTooManyRecordsSelected = createCustomErrorClass("AleoTooManyRecordsSelected");
export const AleoAmountTooLargeForTransaction = createCustomErrorClass(
  "AleoAmountTooLargeForTransaction",
);
export class AleoBondAmountTooLow extends Error {
  override name = "AleoBondAmountTooLow";
  readonly minAmount?: string | undefined;
  constructor(message?: string, fields?: { minAmount?: string }) {
    super(message);
    this.minAmount = fields?.minAmount;
  }
}

export class AleoStakeAmountTooLow extends Error {
  override name = "AleoStakeAmountTooLow";
  readonly minAmount?: string | undefined;
  constructor(message?: string, fields?: { minAmount?: string }) {
    super(message);
    this.minAmount = fields?.minAmount;
  }
}

export class AleoNoClaimableAmount extends Error {
  override name = "AleoNoClaimableAmount";
}

/**
 * Raised when a BOND_PUBLIC transaction targets a validator that the Aleo
 * committee currently reports as closed (not accepting new delegators).
 * This is the bridge-level counterpart to the UI-only guard in
 * StepValidator.tsx, so bonding to a closed validator is rejected even when
 * the UI falls back to a manual address input (e.g. validator fetch failed).
 */
export class AleoClosedValidator extends Error {
  override name = "AleoClosedValidator";
}
