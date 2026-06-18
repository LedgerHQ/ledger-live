export class SimulationError extends Error {
  override name = "SimulationError";
  constructor(message = "SimulationError") {
    super(message);
  }
}

export class TooManyUtxosCritical extends Error {
  override name = "TooManyUtxosCritical";
  constructor(message = "TooManyUtxosCritical") {
    super(message);
  }
}

export class TooManyUtxosWarning extends Error {
  override name = "TooManyUtxosWarning";
  constructor(message = "TooManyUtxosWarning") {
    super(message);
  }
}

export class TopologyChangeError extends Error {
  override name = "TopologyChangeError";
  constructor(message = "TopologyChangeError") {
    super(message);
  }
}
