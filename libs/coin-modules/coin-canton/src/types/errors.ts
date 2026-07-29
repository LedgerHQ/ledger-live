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
