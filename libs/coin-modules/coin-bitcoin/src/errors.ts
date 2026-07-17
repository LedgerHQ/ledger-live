export class AccountNeedResync extends Error {
  override name = "AccountNeedResync";
}

export class TaprootNotActivated extends Error {
  override name = "TaprootNotActivated";
}

export class BitcoinInfrastructureError extends Error {
  override name = "InfrastructureError";
}

export class RbfBuildError extends Error {
  override name = "RbfBuildError";
}

export class FeeTooLow extends Error {
  override name = "FeeTooLow";
}

export class ZcashSaplingRecipientNotSupported extends Error {
  override name = "ZcashSaplingRecipientNotSupported";
}

export class ZcashSignerNotSupported extends Error {
  override name = "ZcashSignerNotSupported";
}

/** Typed cancellation marker for the shielded (PCZT) signOperation flow. */
export class ZcashSigningCancelled extends Error {
  override name = "ZcashSigningCancelled";
}

/** Raised when a transparent UTXO about to be spent by a Public→* PCZT flow
 * cannot be mapped to a known account key (missing address, or an address
 * outside the synced receive/change gap limit). Fail-closed: we refuse to sign
 * rather than risk producing an unsignable or wrong input. */
export class ZcashUtxoNotInAccount extends Error {
  override name = "ZcashUtxoNotInAccount";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class DustLimit extends Error {
  override name = "DustLimit";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class OpReturnDataSizeLimit extends Error {
  override name = "OpReturnSizeLimit";
}
