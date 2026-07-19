export class SimulationError extends Error {
  override name = "SimulationError";
  constructor(message?: string) {
    super(message || "SimulationError");
  }
}

export class TooManyUtxosCritical extends Error {
  override name = "TooManyUtxosCritical";
  constructor(message?: string) {
    super(message || "TooManyUtxosCritical");
  }
}
export class TooManyUtxosWarning extends Error {
  override name = "TooManyUtxosWarning";
  constructor(message?: string) {
    super(message || "TooManyUtxosWarning");
  }
}

export class TopologyChangeError extends Error {
  override name = "TopologyChangeError";
  constructor(message?: string) {
    super(message || "TopologyChangeError");
  }
}
