export { ConcordiumMemoTooLong, ConcordiumInsufficientFunds } from "@ledgerhq/errors";

export class SimulationError extends Error {
  override name = "SimulationError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "SimulationError");
    if (fields) Object.assign(this, fields);
  }
}
