/**
 * Error thrown when hash signing is not enabled on the device.
 */
export class StellarHashSigningNotEnabledError extends Error {
  override name = "StellarHashSigningNotEnabledError";
  constructor(message?: string, fields?: Record<string, unknown>, options?: ErrorOptions) {
    super(message || "StellarHashSigningNotEnabledError", options);
    if (fields) Object.assign(this, fields);
  }
}

/**
 * Error thrown when data parsing fails.
 *
 * For example, when parsing the transaction fails, this error is thrown.
 */
export class StellarDataParsingFailedError extends Error {
  override name = "StellarDataParsingFailedError";
  constructor(message?: string, fields?: Record<string, unknown>, options?: ErrorOptions) {
    super(message || "StellarDataParsingFailedError", options);
    if (fields) Object.assign(this, fields);
  }
}

/**
 * Error thrown when the user refuses the request on the device.
 */
export class StellarUserRefusedError extends Error {
  override name = "StellarUserRefusedError";
  constructor(message?: string, fields?: Record<string, unknown>, options?: ErrorOptions) {
    super(message || "StellarUserRefusedError", options);
    if (fields) Object.assign(this, fields);
  }
}

/**
 * Error thrown when the data is too large to be processed by the device.
 */
export class StellarDataTooLargeError extends Error {
  override name = "StellarDataTooLargeError";
  constructor(message?: string, fields?: Record<string, unknown>, options?: ErrorOptions) {
    super(message || "StellarDataTooLargeError", options);
    if (fields) Object.assign(this, fields);
  }
}
