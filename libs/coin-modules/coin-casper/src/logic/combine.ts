import { PublicKey, Transaction } from "casper-js-sdk";
import invariant from "invariant";

// 1 algorithm-tag byte + 64 signature bytes, fixed length for both SECP256K1 and ED25519.
const SIGNATURE_HEX_LENGTH = 130;

/**
 * `signature` must already carry its algorithm tag byte — the caller that produced it knows
 * which algorithm the device used, so combine doesn't re-derive or prepend one.
 *
 * `pubkey` is required: unlike some chains, Casper can't recover a signer from its signature.
 */
export function combine(tx: string, signature: string[], pubkey?: string): string {
  if (signature.length !== 1) {
    throw new Error(`Casper combine expects exactly one signature, got ${signature.length}`);
  }

  invariant(pubkey, "casper: combine requires the signer public key");

  invariant(
    signature[0].length === SIGNATURE_HEX_LENGTH,
    "casper: combine expects a 65-byte (tag + signature) hex signature",
  );

  const signatureBytes = Buffer.from(signature[0], "hex");

  // Buffer.from(.., "hex") silently truncates at the first non-hex pair, so verify the
  // round-trip to reject malformed hex with an actionable message.
  const isValidHex = signatureBytes.toString("hex") === signature[0].toLowerCase();
  invariant(isValidHex, "casper: invalid hex signature");

  const transaction = Transaction.fromJSON(tx);
  transaction.setSignature(signatureBytes, PublicKey.fromHex(pubkey));

  return JSON.stringify(transaction.toJSON());
}
