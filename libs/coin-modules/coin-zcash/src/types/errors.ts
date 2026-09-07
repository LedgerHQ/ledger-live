// Zcash-specific error classes. Plain `class extends Error`, per
// docs/new-library.md's `src/errors.ts` guidance. Errors that already exist for
// every coin come from @ledgerhq/ledger-wallet-framework/errors instead.

import { TRANSPARENT_OUTPUT_DUST_THRESHOLD } from "../logic/coin-selection";

export class ZcashSaplingRecipientNotSupported extends Error {
  constructor(message = "Sapling recipients are not supported") {
    super(message);
    this.name = "ZcashSaplingRecipientNotSupported";
  }
}

export class ZcashSignerNotSupported extends Error {
  constructor(message = "Signer does not support Zcash PCZT signing") {
    super(message);
    this.name = "ZcashSignerNotSupported";
  }
}

/**
 * Raised when a send that spends or creates shielded value is attempted on an
 * account whose UFVK has not been exported from the device yet. The shielded
 * pools are unreadable without it, so no such transaction can be built. A
 * transparent send is unaffected -- it needs no viewing key (see
 * `bridge/signOperation`'s `resolveAccountKey`).
 */
export class ZcashShieldedKeyMissing extends Error {
  constructor(
    message = "Activate your private balance first: this transfer needs the viewing key from your device",
  ) {
    super(message);
    this.name = "ZcashShieldedKeyMissing";
  }
}

/** Typed cancellation marker for the shielded (PCZT) signOperation flow. */
export class ZcashSigningCancelled extends Error {
  constructor(message = "Zcash signing was cancelled") {
    super(message);
    this.name = "ZcashSigningCancelled";
  }
}

/**
 * Raised when a transparent UTXO about to be spent by a Public→* PCZT flow
 * cannot be mapped to a known account key (missing address, or an address
 * outside the synced receive/change gap limit). Fail-closed: we refuse to sign
 * rather than risk producing an unsignable or wrong input.
 */
export class ZcashUtxoNotInAccount extends Error {
  txid?: string;
  vout?: number;

  constructor(message: string, extra?: { txid: string; vout: number }) {
    super(message);
    this.name = "ZcashUtxoNotInAccount";
    if (extra) {
      this.txid = extra.txid;
      this.vout = extra.vout;
    }
  }
}

/** Raised when a transparent output's amount is below the network's
 * minimum non-dust value -- signing would succeed but broadcast would fail. */
export class ZcashAmountBelowDustThreshold extends Error {
  minimumZatoshis = TRANSPARENT_OUTPUT_DUST_THRESHOLD;

  constructor(
    message = `Amount is too small to be broadcast (minimum ${TRANSPARENT_OUTPUT_DUST_THRESHOLD} zatoshis)`,
  ) {
    super(message);
    this.name = "ZcashAmountBelowDustThreshold";
  }
}

export class ZcashMemoTooLong extends Error {
  maxBytes: number;

  constructor(maxBytes: number, message = `Memo exceeds the ${maxBytes}-byte limit`) {
    super(message);
    this.name = "ZcashMemoTooLong";
    this.maxBytes = maxBytes;
  }
}

/**
 * Raised when a bounded selection cannot cover the requested amount + fee
 * while the account's full (unbounded) balance could -- the device refuses a
 * PCZT past its per-pool action/input ceiling, so the wallet must stop short
 * of it rather than offer a total it cannot sign in one transaction. Distinct
 * from a genuine `NotEnoughBalance`/"Insufficient shielded balance": the funds
 * exist, they are just not reachable in a single send (see
 * bridge/statusHelpers.ts's `hasBoundedTransparentShortfall` and
 * logic/account/spendability.ts's `hasBoundedIronwoodShortfall`).
 */
export class ZcashSendTooLarge extends Error {
  constructor(
    message = "This amount is too large to send in one transaction: try sending it in smaller amounts",
  ) {
    super(message);
    this.name = "ZcashSendTooLarge";
  }
}

/**
 * Raised when the builder rejects a selected note because its leaf position is
 * at or past the number of leaves the Ironwood tree held at its anchor -- the
 * note exists on-chain but is not yet inside the tree the transaction is built
 * against. The maturity filter (`logic/account/spendability`) makes this
 * unreachable in the normal case; this is the safety net for a backend drift
 * between the zaino instance the scan used and the one the builder queries.
 */
export class ZcashNotesNotYetSpendable extends Error {
  constructor(message = "These funds are not spendable yet, try again in a few minutes") {
    super(message);
    this.name = "ZcashNotesNotYetSpendable";
  }
}
