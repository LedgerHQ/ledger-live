import { decodeUnsignedTransaction, encodeMsgpack, SignedTransaction } from "algosdk";

const ED25519_SIGNATURE_LENGTH = 64;

/**
 * Combine an unsigned transaction with a signature
 * @param unsignedTx - The unsigned transaction as a hex string (msgpack encoded)
 * @param signature - The signatures as hex strings; Algorand expects exactly one
 * @returns The signed transaction as a hex string
 */
export function combine(unsignedTx: string, signature: string[]): string {
  if (signature.length !== 1) {
    throw new Error(`Algorand combine expects exactly one signature, got ${signature.length}`);
  }

  const txBytes = Buffer.from(unsignedTx, "hex");
  const txn = decodeUnsignedTransaction(txBytes);
  const sig = Buffer.from(signature[0], "hex").subarray(0, ED25519_SIGNATURE_LENGTH);

  const signedPayload = new SignedTransaction({ sig, txn });
  const msgPackEncoded = encodeMsgpack(signedPayload);
  return Buffer.from(msgPackEncoded).toString("hex");
}
