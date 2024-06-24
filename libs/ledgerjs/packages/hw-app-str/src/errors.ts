import { createCustomErrorClass } from "@ledgerhq/errors";

/**
 * Error thrown when hash signing is not enabled on the device.
 */
export const StellarHashSigningNotEnabledError = createCustomErrorClass(
  "StellarHashSigningNotEnabledError",
);

/**
 * Error thrown when data parsing fails.
 *
 * For example, when parsing the transaction fails, this error is thrown.
 */
export const StellarDataParsingFailedError = createCustomErrorClass(
  "StellarDataParsingFailedError",
);

/**
 * Error thrown when the user refuses the request on the device.
 */
export const StellarUserRefusedError = createCustomErrorClass("StellarUserRefusedError");

/**
 * Error thrown when the data is too large to be processed by the device.
 */
export const StellarDataTooLargeError = createCustomErrorClass("StellarDataTooLargeError");
