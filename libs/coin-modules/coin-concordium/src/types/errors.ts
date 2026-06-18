export { ConcordiumMemoTooLong, ConcordiumInsufficientFunds } from "@ledgerhq/errors";

export class SimulationError extends Error {
  override name = "SimulationError";
  constructor(message = "SimulationError") {
    super(message);
  }
}
