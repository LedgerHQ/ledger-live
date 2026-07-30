import * as nearAPI from "near-api-js";

/**
 * Decode a hex signature, refusing anything Node would quietly truncate.
 *
 * `Buffer.from(value, "hex")` stops at the first invalid character and drops a trailing half-byte,
 * so a malformed signature would otherwise be attached at the wrong length and only fail once the
 * network rejects the broadcast.
 */
function decodeSignature(signature: string): Buffer {
  const decoded = Buffer.from(signature, "hex");

  if (signature.length % 2 !== 0 || decoded.length !== signature.length / 2) {
    throw new Error("Near: signature is not valid hex");
  }
  if (decoded.length === 0) {
    throw new Error("Near: signature is empty");
  }

  return decoded;
}

/**
 * Attach a device signature to a crafted transaction and return the signed transaction, base64'd
 * and ready to broadcast.
 *
 * The key type is read back from the transaction's own public key rather than passed in, so the
 * signature scheme always matches the key the transaction was crafted for.
 */
export function combine(tx: string, signature: string, _pubkey?: string): string {
  const transaction = nearAPI.transactions.Transaction.decode(Buffer.from(tx, "base64"));

  const signedTransaction = new nearAPI.transactions.SignedTransaction({
    transaction,
    signature: new nearAPI.transactions.Signature({
      keyType: transaction.publicKey.keyType,
      data: decodeSignature(signature),
    }),
  });

  return Buffer.from(signedTransaction.encode()).toString("base64");
}
