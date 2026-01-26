import { encode as msgpackEncode } from "algo-msgpack-with-bigint";
import type { EncodedSignedTransaction, EncodedTransaction } from "algosdk";

/**
 * Combine an unsigned transaction with a signature
 * @param unsignedTx - The unsigned transaction as a hex string (msgpack encoded)
 * @param signature - The signature as a hex string
 * @returns The signed transaction as a hex string
 */
export function combine(unsignedTx: string, signature: string): string {
  // Decode the unsigned transaction from msgpack
  const txPayload = JSON.parse(
    Buffer.from(unsignedTx, "hex").toString("utf8"),
  ) as EncodedTransaction;

  // Create signed transaction payload
  const signedPayload: EncodedSignedTransaction = {
    sig: Buffer.from(signature, "hex"),
    txn: txPayload,
  };

  // Encode to msgpack
  const msgPackEncoded = msgpackEncode(signedPayload);

  return Buffer.from(msgPackEncoded).toString("hex");
}
