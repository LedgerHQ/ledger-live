import { createCustomErrorClass } from "@ledgerhq/errors";

export const SimulationError = createCustomErrorClass("SimulationError");

export const TooManyUtxosCritical = createCustomErrorClass("TooManyUtxosCritical");
export const TooManyUtxosWarning = createCustomErrorClass("TooManyUtxosWarning");

export const TopologyChangeError = createCustomErrorClass("TopologyChangeError");
