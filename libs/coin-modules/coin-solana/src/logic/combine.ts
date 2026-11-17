import { PublicKey, VersionedTransaction } from "@solana/web3.js";

const ED25519_SIGNATURE_LENGTH = 64;

/**
 * `signer` is the account the device signed for. Without it the signature goes to the fee payer's
 * slot, which is wrong when a partner pays the fees and the account signs second.
 */
export function combine(tx: string, signature: string[], signer?: string): string {
  if (signature.length !== 1) {
    throw new Error(`Solana combine expects exactly one signature, got ${signature.length}`);
  }

  const transaction = VersionedTransaction.deserialize(Buffer.from(tx, "base64"));
  const sigBuffer = Buffer.from(signature[0], "hex");
  if (sigBuffer.length !== ED25519_SIGNATURE_LENGTH) {
    throw new Error(
      `Invalid signature length: expected ${ED25519_SIGNATURE_LENGTH}, got ${sigBuffer.length}`,
    );
  }

  const signerPubkey = signer ? new PublicKey(signer) : transaction.message.staticAccountKeys[0];
  if (!signerPubkey) {
    throw new Error("Transaction has no account keys to sign with");
  }
  transaction.addSignature(signerPubkey, sigBuffer);

  return Buffer.from(transaction.serialize()).toString("base64");
}
