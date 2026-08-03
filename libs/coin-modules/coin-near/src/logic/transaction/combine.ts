import * as nearAPI from "near-api-js";

// Refuses what `Buffer.from(value, "hex")` would quietly truncate: it stops at the first invalid
// character and drops a trailing half-byte, which would attach a wrong-length signature that only fails at broadcast.
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

// Attaches a device signature and returns the signed, base64'd transaction ready to broadcast. The
// key type is read back from the transaction's own public key, so it always matches the crafting key.
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
