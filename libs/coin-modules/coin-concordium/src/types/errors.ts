import { createCustomErrorClass } from "@ledgerhq/errors";

export const SimulationError = createCustomErrorClass("SimulationError");

export const ConcordiumMemoTooLong = createCustomErrorClass("ConcordiumMemoTooLong");

export const ConcordiumInsufficientFunds = createCustomErrorClass("ConcordiumInsufficientFunds");
