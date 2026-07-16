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
export const InvalidExplorerResponse = createCustomErrorClass("InvalidExplorerResponse");

// Node
export const UnknownNode = createCustomErrorClass("UnknownNode");
export const LedgerNodeUsedIncorrectly = createCustomErrorClass("LedgerNodeUsedIncorrectly");
export const UnsupportedRpcMethodError = createCustomErrorClass<{
  method: string;
  rawError: unknown;
}>("UnsupportedRpcMethodError");

/**
 * Internal-tx source should be skipped (not propagated): not configured, structurally
 * unsupported, best-effort runtime failure (e.g. explorer), or all sources exhausted
 * without `empty`.
 */
export const SourceUnavailableError = createCustomErrorClass("SourceUnavailableError");

// GasTracker errors
export const LedgerGasTrackerUsedIncorrectly = createCustomErrorClass(
  "LedgerGasTrackerUsedIncorrectly",
);
export const NoGasTrackerFound = createCustomErrorClass("NoGasTrackerFound");

// Gas
export const GasPriceTooLow = createCustomErrorClass("GasPriceTooLow");
export const GasEstimationError = createCustomErrorClass("GasEstimationError");
export const InsufficientFunds = createCustomErrorClass("InsufficientFunds");

// Nfts
export const NotOwnedNft = createCustomErrorClass("NotOwnedNft");
export const NotEnoughNftOwned = createCustomErrorClass("NotEnoughNftOwned");
