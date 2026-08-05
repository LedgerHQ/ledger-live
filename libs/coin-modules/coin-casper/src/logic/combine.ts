import { PublicKey, Transaction } from "casper-js-sdk";
import invariant from "invariant";

/**
 * `signature` must already carry its algorithm tag byte — the caller that produced it knows
 * which algorithm the device used, so combine doesn't re-derive or prepend one.
 *
 * `pubkey` is required: unlike some chains, Casper can't recover a signer from its signature.
 */
export function combine(tx: string, signature: string, pubkey?: string): string {
  invariant(pubkey, "casper: combine requires the signer public key");

  const transaction = Transaction.fromJSON(tx);
  transaction.setSignature(Buffer.from(signature, "hex"), PublicKey.fromHex(pubkey));

  return JSON.stringify(transaction.toJSON());
}
