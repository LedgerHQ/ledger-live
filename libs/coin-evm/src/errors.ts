import { createCustomErrorClass } from "@ledgerhq/errors";

export const EtherscanAPIError = createCustomErrorClass("EtherscanAPIError");
export const GasEstimationError = createCustomErrorClass("GasEstimationError");
export const InsufficientFunds = createCustomErrorClass("InsufficientFunds");

// GasTracker errors
export const NoGasTrackerFound = createCustomErrorClass("NoGasTrackerFound");
export const GasTrackerDoesNotSupportEIP1559 = createCustomErrorClass(
  "GasTrackerDoesNotSupportEIP1559",
);
