import { createCustomErrorClass } from "@ledgerhq/errors";

// Etherscan API
export const EtherscanAPIError = createCustomErrorClass("EtherscanAPIError");

// Explorers
export const UnknownExplorer = createCustomErrorClass("UnknownExplorer");
export const LedgerExplorerUsedIncorrectly = createCustomErrorClass(
  "LedgerExplorerUsedIncorrectly",
);
export const EtherscanLikeExplorerUsedIncorrectly = createCustomErrorClass(
  "EtherscanLikeExplorerUsedIncorrectly",
);

// Node
export const UnknownNode = createCustomErrorClass("UnknownNode");
export const LedgerNodeUsedIncorrectly = createCustomErrorClass("LedgerNodeUsedIncorrectly");
export const ExternalNodeUsedIncorrectly = createCustomErrorClass("ExternalNodeUsedIncorrectly");

// GasTracker errors
export const LedgerGasTrackerUsedIncorrectly = createCustomErrorClass(
  "LedgerGasTrackerUsedIncorrectly",
);
export const NoGasTrackerFound = createCustomErrorClass("NoGasTrackerFound");

// Gas
export const GasEstimationError = createCustomErrorClass("GasEstimationError");
export const InsufficientFunds = createCustomErrorClass("InsufficientFunds");

// Nfts
export const NotOwnedNft = createCustomErrorClass("NotOwnedNft");
export const NotEnoughNftOwned = createCustomErrorClass("NotEnoughNftOwned");
export const QuantityNeedsToBePositive = createCustomErrorClass("QuantityNeedsToBePositive");
