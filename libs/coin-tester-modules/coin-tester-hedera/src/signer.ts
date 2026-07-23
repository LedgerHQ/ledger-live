import { PrivateKey } from "@hashgraph/sdk";
import type { HederaSigner } from "@ledgerhq/coin-hedera/types";

/**
 * One signer per account under test. Each scenario owns a separate account, so each builds its own
 * signer; passing an explicit key lets a scenario's fixture code sign for the same account with the
 * raw SDK (e.g. associating a token on a counterparty account).
 *
 * `getPublicKey` returns the raw 32-byte Ed25519 hex, not DER: it becomes the account's
 * `seedIdentifier`, which `coin-hedera`'s `combine()` feeds straight into `PublicKey.fromString`
 * when assembling the signed transaction. The 64-char guard below exists to catch the SDK ever
 * changing its default encoding to DER, which `combine()` would otherwise fail on far from here.
 */
export function buildHederaSigner(
  privateKey: PrivateKey = PrivateKey.generateED25519(),
): HederaSigner {
  return {
    async getPublicKey(_path: string): Promise<string> {
      const raw = privateKey.publicKey.toStringRaw();
      if (raw.length !== 64) {
        throw new Error(
          `hedera tester signer: expected a 64-char raw Ed25519 public key, got ${raw.length} chars — the SDK may have changed its default encoding to DER`,
        );
      }
      return raw;
    },
    async signTransaction(transaction: Uint8Array): Promise<Uint8Array> {
      return privateKey.sign(transaction);
    },
  };
}
