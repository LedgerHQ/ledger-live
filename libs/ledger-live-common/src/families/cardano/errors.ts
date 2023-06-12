import { createCustomErrorClass } from "@ledgerhq/errors";

/**
 * Cardano error thrown when transaction amount is less then minUtxo
 */
export const CardanoMinAmountError = createCustomErrorClass("CardanoMinAmountError");

/**
 * Cardano error thrown when not enough funds to perform transaction
 */
export const CardanoNotEnoughFunds = createCustomErrorClass("CardanoNotEnoughFunds");
