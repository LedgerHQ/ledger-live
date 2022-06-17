import { createCustomErrorClass } from "@ledgerhq/errors";

/**
 * Cardano error thrown when transaction amount is less then minUtxo
 */
export const CardanoMinAmountError = createCustomErrorClass(
  "CardanoMinAmountError"
);
