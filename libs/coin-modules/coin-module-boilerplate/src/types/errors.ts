export class SimulationError extends Error {
  override name = "SimulationError";
  constructor(message = "SimulationError") {
    super(message);
  }
}
