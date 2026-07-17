// Etherscan API
export class EtherscanAPIError extends Error {
  override name = "EtherscanAPIError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

// Explorers
export class UnknownExplorer extends Error {
  override name = "UnknownExplorer";
}

export class LedgerExplorerUsedIncorrectly extends Error {
  override name = "LedgerExplorerUsedIncorrectly";
}

export class EtherscanLikeExplorerUsedIncorrectly extends Error {
  override name = "EtherscanLikeExplorerUsedIncorrectly";
}

export class InvalidExplorerResponse extends Error {
  override name = "InvalidExplorerResponse";
  constructor(message?: string, fields?: Record<string, unknown>, options?: ErrorOptions) {
    super(message, options);
    if (fields) Object.assign(this, fields);
  }
}

// Node
export class UnknownNode extends Error {
  override name = "UnknownNode";
}

export class LedgerNodeUsedIncorrectly extends Error {
  override name = "LedgerNodeUsedIncorrectly";
}

export class UnsupportedRpcMethodError extends Error {
  override name = "UnsupportedRpcMethodError";
  method?: string;
  rawError?: unknown;
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

/** Internal-tx source should be skipped (not propagated): not configured, structurally
 * unsupported, best-effort runtime failure (e.g. explorer), or all sources exhausted
 * without `empty`. */
export class SourceUnavailableError extends Error {
  override name = "SourceUnavailableError";
}

// GasTracker errors
export class LedgerGasTrackerUsedIncorrectly extends Error {
  override name = "LedgerGasTrackerUsedIncorrectly";
}

export class NoGasTrackerFound extends Error {
  override name = "NoGasTrackerFound";
}

// Gas
export class GasPriceTooLow extends Error {
  override name = "GasPriceTooLow";
}

export class GasEstimationError extends Error {
  override name = "GasEstimationError";
}

export class InsufficientFunds extends Error {
  override name = "InsufficientFunds";
}

// Nfts
export class NotOwnedNft extends Error {
  override name = "NotOwnedNft";
}

export class NotEnoughNftOwned extends Error {
  override name = "NotEnoughNftOwned";
}

// Transaction validation
export class GasLessThanEstimate extends Error {
  override name = "GasLessThanEstimate";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class PriorityFeeTooLow extends Error {
  override name = "PriorityFeeTooLow";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class PriorityFeeTooHigh extends Error {
  override name = "PriorityFeeTooHigh";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class PriorityFeeHigherThanMaxFee extends Error {
  override name = "PriorityFeeHigherThanMaxFee";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class MaxFeeTooLow extends Error {
  override name = "MaxFeeTooLow";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class ETHAddressNonEIP extends Error {
  override name = "ETHAddressNonEIP";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class RedelegateDstValAddressRequired extends Error {
  override name = "RedelegateDstValAddressRequired";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class ValAddressRequired extends Error {
  override name = "ValAddressRequired";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class NotEnoughGas extends Error {
  override name = "NotEnoughGas";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class ClaimRewardsFeesWarning extends Error {
  override name = "ClaimRewardsFeesWarning";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}
