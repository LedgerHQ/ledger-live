import invariant from "invariant";
import { PublicKey } from "@hashgraph/sdk";
import { deserializeSignature, deserializeTransaction, serializeTransaction } from "./utils";

export function combine(tx: string, signature: string, publicKey?: string): string {
  invariant(publicKey, "hedera: public key is required to combine the transaction");

  const hederaTransaction = deserializeTransaction(tx);
  const bufferSignature = deserializeSignature(signature);
  const bufferPublicKey = PublicKey.fromString(publicKey);
  hederaTransaction.addSignature(bufferPublicKey, bufferSignature);

  return serializeTransaction(hederaTransaction);
}
