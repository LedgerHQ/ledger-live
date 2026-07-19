// Etherscan API
export class EtherscanAPIError extends Error {
  override name = "EtherscanAPIError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "EtherscanAPIError");
    if (fields) Object.assign(this, fields);
  }
}

// Explorers
export class UnknownExplorer extends Error {
  override name = "UnknownExplorer";
  constructor(message?: string) {
    super(message ?? "UnknownExplorer");
  }
}

export class LedgerExplorerUsedIncorrectly extends Error {
  override name = "LedgerExplorerUsedIncorrectly";
  constructor(message?: string) {
    super(message ?? "LedgerExplorerUsedIncorrectly");
  }
}

export class EtherscanLikeExplorerUsedIncorrectly extends Error {
  override name = "EtherscanLikeExplorerUsedIncorrectly";
  constructor(message?: string) {
    super(message ?? "EtherscanLikeExplorerUsedIncorrectly");
  }
}

export class InvalidExplorerResponse extends Error {
  override name = "InvalidExplorerResponse";
  constructor(message?: string, fields?: Record<string, unknown>, options?: ErrorOptions) {
    super(message ?? "InvalidExplorerResponse", options);
    if (fields) Object.assign(this, fields);
  }
}

// Node
export class UnknownNode extends Error {
  override name = "UnknownNode";
  constructor(message?: string) {
    super(message ?? "UnknownNode");
  }
}

export class LedgerNodeUsedIncorrectly extends Error {
  override name = "LedgerNodeUsedIncorrectly";
  constructor(message?: string) {
    super(message ?? "LedgerNodeUsedIncorrectly");
  }
}

export class UnsupportedRpcMethodError extends Error {
  override name = "UnsupportedRpcMethodError";
  method?: string;
  rawError?: unknown;
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "UnsupportedRpcMethodError");
    if (fields) Object.assign(this, fields);
  }
}

/** Internal-tx source should be skipped (not propagated): not configured, structurally
 * unsupported, best-effort runtime failure (e.g. explorer), or all sources exhausted
 * without `empty`. */
export class SourceUnavailableError extends Error {
  override name = "SourceUnavailableError";
  constructor(message?: string) {
    super(message ?? "SourceUnavailableError");
  }
}

// GasTracker errors
export class LedgerGasTrackerUsedIncorrectly extends Error {
  override name = "LedgerGasTrackerUsedIncorrectly";
  constructor(message?: string) {
    super(message ?? "LedgerGasTrackerUsedIncorrectly");
  }
}

export class NoGasTrackerFound extends Error {
  override name = "NoGasTrackerFound";
  constructor(message?: string) {
    super(message ?? "NoGasTrackerFound");
  }
}

// Gas
export class GasPriceTooLow extends Error {
  override name = "GasPriceTooLow";
  constructor(message?: string) {
    super(message ?? "GasPriceTooLow");
  }
}

export class GasEstimationError extends Error {
  override name = "GasEstimationError";
  constructor(message?: string) {
    super(message ?? "GasEstimationError");
  }
}

export class InsufficientFunds extends Error {
  override name = "InsufficientFunds";
  constructor(message?: string) {
    super(message ?? "InsufficientFunds");
  }
}

// Nfts
export class NotOwnedNft extends Error {
  override name = "NotOwnedNft";
  constructor(message?: string) {
    super(message ?? "NotOwnedNft");
  }
}

export class NotEnoughNftOwned extends Error {
  override name = "NotEnoughNftOwned";
  constructor(message?: string) {
    super(message ?? "NotEnoughNftOwned");
  }
}

// Transaction validation
export class GasLessThanEstimate extends Error {
  override name = "GasLessThanEstimate";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "GasLessThanEstimate");
    if (fields) Object.assign(this, fields);
  }
}

export class PriorityFeeTooLow extends Error {
  override name = "PriorityFeeTooLow";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "PriorityFeeTooLow");
    if (fields) Object.assign(this, fields);
  }
}

export class PriorityFeeTooHigh extends Error {
  override name = "PriorityFeeTooHigh";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "PriorityFeeTooHigh");
    if (fields) Object.assign(this, fields);
  }
}

export class PriorityFeeHigherThanMaxFee extends Error {
  override name = "PriorityFeeHigherThanMaxFee";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "PriorityFeeHigherThanMaxFee");
    if (fields) Object.assign(this, fields);
  }
}

export class MaxFeeTooLow extends Error {
  override name = "MaxFeeTooLow";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "MaxFeeTooLow");
    if (fields) Object.assign(this, fields);
  }
}

export class ETHAddressNonEIP extends Error {
  override name = "ETHAddressNonEIP";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "ETHAddressNonEIP");
    if (fields) Object.assign(this, fields);
  }
}

export class RedelegateDstValAddressRequired extends Error {
  override name = "RedelegateDstValAddressRequired";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "RedelegateDstValAddressRequired");
    if (fields) Object.assign(this, fields);
  }
}

export class ValAddressRequired extends Error {
  override name = "ValAddressRequired";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "ValAddressRequired");
    if (fields) Object.assign(this, fields);
  }
}

export class NotEnoughGas extends Error {
  override name = "NotEnoughGas";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "NotEnoughGas");
    if (fields) Object.assign(this, fields);
  }
}

export class ClaimRewardsFeesWarning extends Error {
  override name = "ClaimRewardsFeesWarning";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "ClaimRewardsFeesWarning");
    if (fields) Object.assign(this, fields);
  }
}
