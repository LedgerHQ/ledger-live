// Zcash-specific error classes. Plain `class extends Error`, per
// docs/new-library.md's `src/errors.ts` guidance. Errors that already exist for
// every coin come from @ledgerhq/ledger-wallet-framework/errors instead.

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
