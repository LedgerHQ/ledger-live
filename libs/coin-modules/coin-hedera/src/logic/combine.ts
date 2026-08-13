import { PublicKey } from "@hashgraph/sdk";
import invariant from "invariant";
import { deserializeSignature, deserializeTransaction, serializeTransaction } from "./utils";

export function combine(tx: string, signature: string[], publicKey?: string): string {
  if (signature.length !== 1) {
    throw new Error(`Hedera combine expects exactly one signature, got ${signature.length}`);
  }

  invariant(publicKey, "hedera: public key is required to combine the transaction");

  const hederaTransaction = deserializeTransaction(tx);
  const bufferSignature = deserializeSignature(signature[0]);
  const bufferPublicKey = PublicKey.fromString(publicKey);
  hederaTransaction.addSignature(bufferPublicKey, bufferSignature);

  return serializeTransaction(hederaTransaction);
}
