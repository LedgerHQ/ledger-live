import { createCustomErrorClass } from "@ledgerhq/errors";

// AccountNeedResync and RbfBuildError now live in @ledgerhq/wallet-btc; re-exported
// here for backward compatibility with existing @ledgerhq/coin-bitcoin consumers.
export { AccountNeedResync, RbfBuildError } from "@ledgerhq/wallet-btc/errors";

export const TaprootNotActivated = createCustomErrorClass("TaprootNotActivated");

export const BitcoinInfrastructureError = createCustomErrorClass("InfrastructureError");

export const FeeTooLow = createCustomErrorClass("FeeTooLow");

export const ZcashSaplingRecipientNotSupported = createCustomErrorClass(
  "ZcashSaplingRecipientNotSupported",
);

export const ZcashSignerNotSupported = createCustomErrorClass("ZcashSignerNotSupported");

// Typed cancellation marker for the shielded (PCZT) signOperation flow.
export const ZcashSigningCancelled = createCustomErrorClass("ZcashSigningCancelled");

// Raised when a transparent UTXO about to be spent by a Public→* PCZT flow
// cannot be mapped to a known account key (missing address, or an address
// outside the synced receive/change gap limit). Fail-closed: we refuse to sign
// rather than risk producing an unsignable or wrong input.
export const ZcashUtxoNotInAccount = createCustomErrorClass("ZcashUtxoNotInAccount");
