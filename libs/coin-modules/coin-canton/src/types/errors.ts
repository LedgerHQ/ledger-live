export class SimulationError extends Error {
  override name = "SimulationError";
}

export class TooManyUtxosCritical extends Error {
  override name = "TooManyUtxosCritical";
}
export class TooManyUtxosWarning extends Error {
  override name = "TooManyUtxosWarning";
}

export class TopologyChangeError extends Error {
  override name = "TopologyChangeError";
}
