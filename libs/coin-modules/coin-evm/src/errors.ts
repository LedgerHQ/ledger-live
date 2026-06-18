// Etherscan API
export class EtherscanAPIError extends Error {
  override name = "EtherscanAPIError";
  constructor(message = "EtherscanAPIError", fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

// Explorers
export class UnknownExplorer extends Error {
  override name = "UnknownExplorer";
  constructor(message = "UnknownExplorer") {
    super(message);
  }
}
export class LedgerExplorerUsedIncorrectly extends Error {
  override name = "LedgerExplorerUsedIncorrectly";
  constructor(message = "LedgerExplorerUsedIncorrectly") {
    super(message);
  }
}
export class EtherscanLikeExplorerUsedIncorrectly extends Error {
  override name = "EtherscanLikeExplorerUsedIncorrectly";
  constructor(message = "EtherscanLikeExplorerUsedIncorrectly") {
    super(message);
  }
}
export class InvalidExplorerResponse extends Error {
  override name = "InvalidExplorerResponse";
  cause?: unknown;
  constructor(
    message = "InvalidExplorerResponse",
    fields?: Record<string, unknown>,
    options?: { cause?: unknown },
  ) {
    super(message);
    if (fields) Object.assign(this, fields);
    if (options && "cause" in options) this.cause = options.cause;
  }
}

// Node
export class UnknownNode extends Error {
  override name = "UnknownNode";
  constructor(message = "UnknownNode") {
    super(message);
  }
}
export class LedgerNodeUsedIncorrectly extends Error {
  override name = "LedgerNodeUsedIncorrectly";
  constructor(message = "LedgerNodeUsedIncorrectly") {
    super(message);
  }
}
export class UnsupportedRpcMethodError extends Error {
  override name = "UnsupportedRpcMethodError";
  method?: string;
  rawError?: unknown;
  constructor(
    message = "UnsupportedRpcMethodError",
    fields?: { method: string; rawError: unknown },
  ) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

// GasTracker errors
export class LedgerGasTrackerUsedIncorrectly extends Error {
  override name = "LedgerGasTrackerUsedIncorrectly";
  constructor(message = "LedgerGasTrackerUsedIncorrectly") {
    super(message);
  }
}
export class NoGasTrackerFound extends Error {
  override name = "NoGasTrackerFound";
  constructor(message = "NoGasTrackerFound") {
    super(message);
  }
}

// Gas
export class GasEstimationError extends Error {
  override name = "GasEstimationError";
  constructor(message = "GasEstimationError") {
    super(message);
  }
}
export class InsufficientFunds extends Error {
  override name = "InsufficientFunds";
  constructor(message = "InsufficientFunds") {
    super(message);
  }
}

// Nfts
export class NotOwnedNft extends Error {
  override name = "NotOwnedNft";
  constructor(message = "NotOwnedNft") {
    super(message);
  }
}
export class NotEnoughNftOwned extends Error {
  override name = "NotEnoughNftOwned";
  constructor(message = "NotEnoughNftOwned") {
    super(message);
  }
}
