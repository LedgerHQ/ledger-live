import { decodeUnsignedTransaction, encodeMsgpack, SignedTransaction } from "algosdk";

const ED25519_SIGNATURE_LENGTH = 64;

/**
 * Combine an unsigned transaction with a signature
 * @param unsignedTx - The unsigned transaction as a hex string (msgpack encoded)
 * @param signature - The signature as a hex string
 * @returns The signed transaction as a hex string
 */
export function combine(unsignedTx: string, signature: string): string {
  const txBytes = Buffer.from(unsignedTx, "hex");
  const txn = decodeUnsignedTransaction(txBytes);
  const sig = Buffer.from(signature, "hex").subarray(0, ED25519_SIGNATURE_LENGTH);

  const signedPayload = new SignedTransaction({ sig, txn });
  const msgPackEncoded = encodeMsgpack(signedPayload);
  return Buffer.from(msgPackEncoded).toString("hex");
}
