import { PublicKey, VersionedTransaction } from "@solana/web3.js";

const ED25519_SIGNATURE_LENGTH = 64;

export function combine(tx: string, signature: string, pubkey?: string): string {
  const transaction = VersionedTransaction.deserialize(Buffer.from(tx, "base64"));
  const sigBuffer = Buffer.from(signature, "hex");
  if (sigBuffer.length !== ED25519_SIGNATURE_LENGTH) {
    throw new Error(
      `Invalid signature length: expected ${ED25519_SIGNATURE_LENGTH}, got ${sigBuffer.length}`,
    );
  }

  if (!pubkey) {
    const signerPubkey = transaction.message.staticAccountKeys[0];
    if (!signerPubkey) {
      throw new Error("Transaction has no account keys to sign with");
    }
    transaction.addSignature(signerPubkey, sigBuffer);
  } else {
    transaction.addSignature(new PublicKey(pubkey), sigBuffer);
  }

  return Buffer.from(transaction.serialize()).toString("base64");
}
