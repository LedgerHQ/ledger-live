// AccountNeedResync and RbfBuildError now live in @ledgerhq/wallet-btc; re-exported
// here for backward compatibility with existing @ledgerhq/coin-bitcoin consumers.
export { AccountNeedResync, RbfBuildError } from "@ledgerhq/wallet-btc/errors";

export class TaprootNotActivated extends Error {
  override name = "TaprootNotActivated";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "TaprootNotActivated");
    if (fields) Object.assign(this, fields);
  }
}

export class BitcoinInfrastructureError extends Error {
  override name = "InfrastructureError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "InfrastructureError");
    if (fields) Object.assign(this, fields);
  }
}

export class FeeTooLow extends Error {
  override name = "FeeTooLow";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "FeeTooLow");
    if (fields) Object.assign(this, fields);
  }
}

export class ZcashSaplingRecipientNotSupported extends Error {
  override name = "ZcashSaplingRecipientNotSupported";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "ZcashSaplingRecipientNotSupported");
    if (fields) Object.assign(this, fields);
  }
}

export class ZcashSignerNotSupported extends Error {
  override name = "ZcashSignerNotSupported";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "ZcashSignerNotSupported");
    if (fields) Object.assign(this, fields);
  }
}

// Typed cancellation marker for the shielded (PCZT) signOperation flow.
export class ZcashSigningCancelled extends Error {
  override name = "ZcashSigningCancelled";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "ZcashSigningCancelled");
    if (fields) Object.assign(this, fields);
  }
}

// Raised when a transparent UTXO about to be spent by a Public→* PCZT flow
// cannot be mapped to a known account key (missing address, or an address
// outside the synced receive/change gap limit). Fail-closed: we refuse to sign
// rather than risk producing an unsignable or wrong input.
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
  override name = "OpReturnDataSizeLimit";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "OpReturnDataSizeLimit");
    if (fields) Object.assign(this, fields);
  }
}
