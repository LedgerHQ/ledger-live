import { VersionedTransaction } from "@solana/web3.js";

const ED25519_SIGNATURE_LENGTH = 64;

export function combine(tx: string, signature: string): string {
  const transaction = VersionedTransaction.deserialize(Buffer.from(tx, "base64"));
  const sigBuffer = Buffer.from(signature, "hex");
  if (sigBuffer.length !== ED25519_SIGNATURE_LENGTH) {
    throw new Error(
      `Invalid signature length: expected ${ED25519_SIGNATURE_LENGTH}, got ${sigBuffer.length}`,
    );
  }

  const signerPubkey = transaction.message.staticAccountKeys[0];
  if (!signerPubkey) {
    throw new Error("Transaction has no account keys to sign with");
  }
  transaction.addSignature(signerPubkey, sigBuffer);

  return Buffer.from(transaction.serialize()).toString("base64");
}
