import { createCustomErrorClass } from "@ledgerhq/errors";

/**
 * Cardano error thrown when transaction amount is less then minUtxo
 */
export const CardanoMinAmountError = createCustomErrorClass("CardanoMinAmountError");

/**
 * Cardano error thrown when user don't have enough fund for deposit
 */
export const CardanoStakeKeyDepositError = createCustomErrorClass("CardanoStakeKeyDepositError");

/**
 * Cardano error thrown when not enough funds to perform transaction
 */
export const CardanoNotEnoughFunds = createCustomErrorClass("CardanoNotEnoughFunds");

export const CardanoInvalidPoolId = createCustomErrorClass("CardanoInvalidPoolId");

/**
 * Cardano warning/error for high fees
 */
export const CardanoFeeHigh = createCustomErrorClass("CardanoFeeHigh");
export const CardanoFeeTooHigh = createCustomErrorClass("CardanoFeeTooHigh");

export const CardanoInvalidProtoParams = createCustomErrorClass("CardanoInvalidProtoParams");
