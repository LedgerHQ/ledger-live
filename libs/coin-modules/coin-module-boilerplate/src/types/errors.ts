export class SimulationError extends Error {
  override name = "SimulationError";
  constructor(message?: string) {
    super(message ?? "SimulationError");
  }
}
