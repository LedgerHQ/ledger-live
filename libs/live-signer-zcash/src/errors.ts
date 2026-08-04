export class UserRefusedOnDevice extends Error {
  override name = "UserRefusedOnDevice";
  constructor(message?: string) {
    super(message || "UserRefusedOnDevice");
  }
}

/**
 * `errorCode` the Zcash signer kit reports when the Zcash app installed on the
 * device cannot read a V6 (ZIP-229) source transaction. Not a device status word:
 * the kit raises it from the app version, before any APDU is sent.
 */
export const UNSUPPORTED_V6_TRANSACTION_ERROR_CODE = "unsupported_v6_transaction";

/**
 * `_tag` of that same kit error. Matched alongside the code, so a rename of either
 * one on its own still reaches the mapping rather than degrading to a bare tag.
 * Both are strings the kit does not export; until it does, this is the guard.
 */
export const UNSUPPORTED_V6_TRANSACTION_ERROR_TAG = "UnsupportedV6TransactionError";

/**
 * Spending a UTXO whose source transaction is a V6 (Ironwood) one, on a Zcash app
 * that predates V6 support.
 *
 * The app rejects such a transaction before signing anything, so this reports a
 * limitation of the installed app. The default message stands in for the signer
 * kit's own, which names the installed version; neither names a version to install.
 */
export class UnsupportedV6SourceTransaction extends Error {
  override name = "UnsupportedV6SourceTransaction";
  constructor(message?: string) {
    super(
      message ||
        "The Zcash app version installed on the device does not support V6 (Ironwood) source transactions, so a UTXO received from one cannot be signed. Support is expected in a future Zcash app update.",
    );
  }
}
