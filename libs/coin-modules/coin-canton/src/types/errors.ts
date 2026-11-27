export class SimulationError extends Error {
  override name = "SimulationError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "SimulationError");
    if (fields) Object.assign(this, fields);
  }
}

export class TooManyUtxosCritical extends Error {
  override name = "TooManyUtxosCritical";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "TooManyUtxosCritical");
    if (fields) Object.assign(this, fields);
  }
}

export class TooManyUtxosWarning extends Error {
  override name = "TooManyUtxosWarning";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "TooManyUtxosWarning");
    if (fields) Object.assign(this, fields);
  }
}

export class TopologyChangeError extends Error {
  override name = "TopologyChangeError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "TopologyChangeError");
    if (fields) Object.assign(this, fields);
  }
}

export class TransferOfferExpiredError extends Error {
  override name = "TransferOfferExpiredError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "TransferOfferExpiredError");
    if (fields) Object.assign(this, fields);
  }
}

/** A coin-config value that breaks an invariant of its reader, such as a zero TTL or page size. */
export class CantonInvalidConfigError extends Error {
  override name = "CantonInvalidConfigError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "CantonInvalidConfigError");
    if (fields) Object.assign(this, fields);
  }
}
