// The 4 Zcash error classes (Option D -- self-contained, no @ledgerhq/errors
// custom-class factory dependency so this package has no coin-bitcoin tie-in).
// Plain `class extends Error`, per docs/new-library.md's `src/errors.ts` guidance.

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
