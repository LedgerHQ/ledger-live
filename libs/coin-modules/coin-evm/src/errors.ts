// Etherscan API
export class EtherscanAPIError extends Error {
  override name = "EtherscanAPIError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "EtherscanAPIError");
    if (fields) Object.assign(this, fields);
  }
}

// Explorers
export class UnknownExplorer extends Error {
  override name = "UnknownExplorer";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "UnknownExplorer");
    if (fields) Object.assign(this, fields);
  }
}

export class LedgerExplorerUsedIncorrectly extends Error {
  override name = "LedgerExplorerUsedIncorrectly";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "LedgerExplorerUsedIncorrectly");
    if (fields) Object.assign(this, fields);
  }
}

export class EtherscanLikeExplorerUsedIncorrectly extends Error {
  override name = "EtherscanLikeExplorerUsedIncorrectly";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "EtherscanLikeExplorerUsedIncorrectly");
    if (fields) Object.assign(this, fields);
  }
}

export class InvalidExplorerResponse extends Error {
  override name = "InvalidExplorerResponse";
  constructor(message?: string, fields?: Record<string, unknown>, options?: { cause?: unknown }) {
    super(message || "InvalidExplorerResponse");
    if (fields) Object.assign(this, fields);
    if (options?.cause !== undefined) Object.assign(this, { cause: options.cause });
  }
}

// Node
export class UnknownNode extends Error {
  override name = "UnknownNode";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "UnknownNode");
    if (fields) Object.assign(this, fields);
  }
}

export class LedgerNodeUsedIncorrectly extends Error {
  override name = "LedgerNodeUsedIncorrectly";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "LedgerNodeUsedIncorrectly");
    if (fields) Object.assign(this, fields);
  }
}

export class UnsupportedRpcMethodError extends Error {
  override name = "UnsupportedRpcMethodError";
  method?: string;
  rawError?: unknown;
  constructor(message?: string, fields?: { method?: string; rawError?: unknown }) {
    super(message || "UnsupportedRpcMethodError");
    if (fields) Object.assign(this, fields);
  }
}

/**
 * Internal-tx source should be skipped (not propagated): not configured, structurally
 * unsupported, best-effort runtime failure (e.g. explorer), or all sources exhausted
 * without `empty`.
 */
export class SourceUnavailableError extends Error {
  override name = "SourceUnavailableError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "SourceUnavailableError");
    if (fields) Object.assign(this, fields);
  }
}

// GasTracker errors
export class LedgerGasTrackerUsedIncorrectly extends Error {
  override name = "LedgerGasTrackerUsedIncorrectly";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "LedgerGasTrackerUsedIncorrectly");
    if (fields) Object.assign(this, fields);
  }
}

export class NoGasTrackerFound extends Error {
  override name = "NoGasTrackerFound";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "NoGasTrackerFound");
    if (fields) Object.assign(this, fields);
  }
}

// Gas
export class GasPriceTooLow extends Error {
  override name = "GasPriceTooLow";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "GasPriceTooLow");
    if (fields) Object.assign(this, fields);
  }
}

export class GasEstimationError extends Error {
  override name = "GasEstimationError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "GasEstimationError");
    if (fields) Object.assign(this, fields);
  }
}

export class InsufficientFunds extends Error {
  override name = "InsufficientFunds";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "InsufficientFunds");
    if (fields) Object.assign(this, fields);
  }
}

// Nfts
export class NotOwnedNft extends Error {
  override name = "NotOwnedNft";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "NotOwnedNft");
    if (fields) Object.assign(this, fields);
  }
}

export class NotEnoughNftOwned extends Error {
  override name = "NotEnoughNftOwned";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "NotEnoughNftOwned");
    if (fields) Object.assign(this, fields);
  }
}

// Transaction validation
export class GasLessThanEstimate extends Error {
  override name = "GasLessThanEstimate";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "GasLessThanEstimate");
    if (fields) Object.assign(this, fields);
  }
}

export class PriorityFeeTooLow extends Error {
  override name = "PriorityFeeTooLow";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "PriorityFeeTooLow");
    if (fields) Object.assign(this, fields);
  }
}

export class PriorityFeeTooHigh extends Error {
  override name = "PriorityFeeTooHigh";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "PriorityFeeTooHigh");
    if (fields) Object.assign(this, fields);
  }
}

export class PriorityFeeHigherThanMaxFee extends Error {
  override name = "PriorityFeeHigherThanMaxFee";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "PriorityFeeHigherThanMaxFee");
    if (fields) Object.assign(this, fields);
  }
}

export class MaxFeeTooLow extends Error {
  override name = "MaxFeeTooLow";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "MaxFeeTooLow");
    if (fields) Object.assign(this, fields);
  }
}

export class ETHAddressNonEIP extends Error {
  override name = "ETHAddressNonEIP";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "ETHAddressNonEIP");
    if (fields) Object.assign(this, fields);
  }
}

export class RedelegateDstValAddressRequired extends Error {
  override name = "RedelegateDstValAddressRequired";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "RedelegateDstValAddressRequired");
    if (fields) Object.assign(this, fields);
  }
}

export class ValAddressRequired extends Error {
  override name = "ValAddressRequired";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "ValAddressRequired");
    if (fields) Object.assign(this, fields);
  }
}

export class NotEnoughGas extends Error {
  override name = "NotEnoughGas";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "NotEnoughGas");
    if (fields) Object.assign(this, fields);
  }
}
