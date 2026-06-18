/**
 * Error thrown when hash signing is not enabled on the device.
 */
export class StellarHashSigningNotEnabledError extends Error {
  override name = "StellarHashSigningNotEnabledError";
  cause?: unknown;
  constructor(
    message = "StellarHashSigningNotEnabledError",
    fields?: Record<string, unknown>,
    options?: { cause?: unknown },
  ) {
    super(message);
    if (fields) Object.assign(this, fields);
    if (options && "cause" in options) this.cause = options.cause;
  }
}

/**
 * Error thrown when data parsing fails.
 *
 * For example, when parsing the transaction fails, this error is thrown.
 */
export class StellarDataParsingFailedError extends Error {
  override name = "StellarDataParsingFailedError";
  cause?: unknown;
  constructor(
    message = "StellarDataParsingFailedError",
    fields?: Record<string, unknown>,
    options?: { cause?: unknown },
  ) {
    super(message);
    if (fields) Object.assign(this, fields);
    if (options && "cause" in options) this.cause = options.cause;
  }
}

/**
 * Error thrown when the user refuses the request on the device.
 */
export class StellarUserRefusedError extends Error {
  override name = "StellarUserRefusedError";
  cause?: unknown;
  constructor(
    message = "StellarUserRefusedError",
    fields?: Record<string, unknown>,
    options?: { cause?: unknown },
  ) {
    super(message);
    if (fields) Object.assign(this, fields);
    if (options && "cause" in options) this.cause = options.cause;
  }
}

/**
 * Error thrown when the data is too large to be processed by the device.
 */
export class StellarDataTooLargeError extends Error {
  override name = "StellarDataTooLargeError";
  cause?: unknown;
  constructor(
    message = "StellarDataTooLargeError",
    fields?: Record<string, unknown>,
    options?: { cause?: unknown },
  ) {
    super(message);
    if (fields) Object.assign(this, fields);
    if (options && "cause" in options) this.cause = options.cause;
  }
}
