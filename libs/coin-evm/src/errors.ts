import { createCustomErrorClass } from "@ledgerhq/errors";

// Etherscan API
export const EtherscanAPIError = createCustomErrorClass("EtherscanAPIError");

// Gas
export const GasEstimationError = createCustomErrorClass("GasEstimationError");
export const InsufficientFunds = createCustomErrorClass("InsufficientFunds");

// GasTracker errors
export const NoGasTrackerFound = createCustomErrorClass("NoGasTrackerFound");
export const GasTrackerDoesNotSupportEIP1559 = createCustomErrorClass(
  "GasTrackerDoesNotSupportEIP1559",
);

// Nfts
export const NotOwnedNft = createCustomErrorClass("NotOwnedNft");
export const NotEnoughNftOwned = createCustomErrorClass("NotEnoughNftOwned");
export const QuantityNeedsToBePositive = createCustomErrorClass("QuantityNeedsToBePositive");
