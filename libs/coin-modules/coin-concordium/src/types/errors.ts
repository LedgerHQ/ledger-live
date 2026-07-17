export class ConcordiumMemoTooLong extends Error {
  override name = "ConcordiumMemoTooLong";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class ConcordiumInsufficientFunds extends Error {
  override name = "ConcordiumInsufficientFunds";
}

export class ConcordiumTrustedMetadataServiceError extends Error {
  override name = "ConcordiumTrustedMetadataServiceError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class ConcordiumSessionExpiredError extends Error {
  override name = "ConcordiumSessionExpiredError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class ConcordiumPairingExpiredError extends Error {
  override name = "ConcordiumPairingExpiredError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class ConcordiumAddressVerificationFailedError extends Error {
  override name = "ConcordiumAddressVerificationFailedError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class ConcordiumInvalidMaxFeeError extends Error {
  override name = "ConcordiumInvalidMaxFeeError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class SimulationError extends Error {
  override name = "SimulationError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}
