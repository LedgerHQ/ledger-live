export class ConcordiumMemoTooLong extends Error {
  override name = "ConcordiumMemoTooLong";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "ConcordiumMemoTooLong");
    if (fields) Object.assign(this, fields);
  }
}

export class ConcordiumInsufficientFunds extends Error {
  override name = "ConcordiumInsufficientFunds";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "ConcordiumInsufficientFunds");
    if (fields) Object.assign(this, fields);
  }
}

export class ConcordiumTrustedMetadataServiceError extends Error {
  override name = "ConcordiumTrustedMetadataServiceError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "ConcordiumTrustedMetadataServiceError");
    if (fields) Object.assign(this, fields);
  }
}

export class ConcordiumSessionExpiredError extends Error {
  override name = "ConcordiumSessionExpiredError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "ConcordiumSessionExpiredError");
    if (fields) Object.assign(this, fields);
  }
}

export class ConcordiumPairingExpiredError extends Error {
  override name = "ConcordiumPairingExpiredError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "ConcordiumPairingExpiredError");
    if (fields) Object.assign(this, fields);
  }
}

export class ConcordiumAddressVerificationFailedError extends Error {
  override name = "ConcordiumAddressVerificationFailedError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "ConcordiumAddressVerificationFailedError");
    if (fields) Object.assign(this, fields);
  }
}

export class ConcordiumInvalidMaxFeeError extends Error {
  override name = "ConcordiumInvalidMaxFeeError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "ConcordiumInvalidMaxFeeError");
    if (fields) Object.assign(this, fields);
  }
}

export class SimulationError extends Error {
  override name = "SimulationError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "SimulationError");
    if (fields) Object.assign(this, fields);
  }
}

/**
 * The device refused the PLT payload the wallet built, or the signer refused it
 * before sending. The user did nothing wrong, so this is reported as a defect
 * rather than as a rejected transaction.
 */
export class ConcordiumInvalidPltPayloadError extends Error {
  override name = "ConcordiumInvalidPltPayloadError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "ConcordiumInvalidPltPayloadError");
    if (fields) Object.assign(this, fields);
  }
}

/**
 * The signer and the device app disagree on the APDU contract: wrong P1/P2,
 * unexpected state, malformed parameter or derivation path, or a device-side
 * buffer or crypto failure.
 */
export class ConcordiumSignerProtocolError extends Error {
  override name = "ConcordiumSignerProtocolError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "ConcordiumSignerProtocolError");
    if (fields) Object.assign(this, fields);
  }
}

/**
 * The installed Concordium app predates PLT support. Kept distinct from the
 * other signer errors so the send flow can offer an app update instead of
 * reporting a signing failure.
 */
export class ConcordiumAppOutdatedError extends Error {
  override name = "ConcordiumAppOutdatedError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "ConcordiumAppOutdatedError");
    if (fields) Object.assign(this, fields);
  }
}
