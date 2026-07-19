export class AccountNeedResync extends Error {
  override name = "AccountNeedResync";
  constructor(message?: string) {
    super(message || "AccountNeedResync");
  }
}

export class TaprootNotActivated extends Error {
  override name = "TaprootNotActivated";
  constructor(message?: string) {
    super(message || "TaprootNotActivated");
  }
}

export class BitcoinInfrastructureError extends Error {
  override name = "InfrastructureError";
  constructor(message?: string) {
    super(message || "BitcoinInfrastructureError");
  }
}

export class RbfBuildError extends Error {
  override name = "RbfBuildError";
  constructor(message?: string) {
    super(message || "RbfBuildError");
  }
}

export class FeeTooLow extends Error {
  override name = "FeeTooLow";
  constructor(message?: string) {
    super(message || "FeeTooLow");
  }
}

export class ZcashSaplingRecipientNotSupported extends Error {
  override name = "ZcashSaplingRecipientNotSupported";
  constructor(message?: string) {
    super(message || "ZcashSaplingRecipientNotSupported");
  }
}

export class ZcashSignerNotSupported extends Error {
  override name = "ZcashSignerNotSupported";
  constructor(message?: string) {
    super(message || "ZcashSignerNotSupported");
  }
}

/** Typed cancellation marker for the shielded (PCZT) signOperation flow. */
export class ZcashSigningCancelled extends Error {
  override name = "ZcashSigningCancelled";
  constructor(message?: string) {
    super(message || "ZcashSigningCancelled");
  }
}

/** Raised when a transparent UTXO about to be spent by a Public→* PCZT flow
 * cannot be mapped to a known account key (missing address, or an address
 * outside the synced receive/change gap limit). Fail-closed: we refuse to sign
 * rather than risk producing an unsignable or wrong input. */
export class ZcashUtxoNotInAccount extends Error {
  override name = "ZcashUtxoNotInAccount";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "ZcashUtxoNotInAccount");
    if (fields) Object.assign(this, fields);
  }
}

export class DustLimit extends Error {
  override name = "DustLimit";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "DustLimit");
    if (fields) Object.assign(this, fields);
  }
}

export class OpReturnDataSizeLimit extends Error {
  override name = "OpReturnSizeLimit";
  constructor(message?: string) {
    super(message || "OpReturnDataSizeLimit");
  }
}
