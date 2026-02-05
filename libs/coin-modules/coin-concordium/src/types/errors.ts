import { createCustomErrorClass } from "@ledgerhq/errors";

export const SimulationError = createCustomErrorClass("SimulationError");

export const ConcordiumMemoTooLong = createCustomErrorClass("ConcordiumMemoTooLong");
