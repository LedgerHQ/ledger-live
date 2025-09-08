import { PublicKey, Transaction } from "@hashgraph/sdk";
import invariant from "invariant";

export function combine(tx: string, signature: string, publicKey?: string): string {
  invariant(publicKey, "Public key is required to combine the transaction");

  const hederaTransaction = Transaction.fromBytes(Buffer.from(tx, "hex"));
  const bufferPublicKey = PublicKey.fromString(publicKey);
  const bufferSignature = Buffer.from(signature, "base64");
  hederaTransaction.addSignature(bufferPublicKey, bufferSignature);

  return Buffer.from(hederaTransaction.toBytes()).toString("hex");
}
