import { createCustomErrorClass } from "@ledgerhq/errors";

export { ConcordiumMemoTooLong, ConcordiumInsufficientFunds } from "@ledgerhq/errors";

export const SimulationError = createCustomErrorClass("SimulationError");
