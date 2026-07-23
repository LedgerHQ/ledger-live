import { PrivateKey } from "@hashgraph/sdk";
import type { HederaSigner } from "@ledgerhq/coin-hedera/types";

/** Ephemeral Ed25519 keypair, memoized per process; not deterministic across runs. */
const OPERATOR_KEY = PrivateKey.generateED25519();

/**
 * `getPublicKey` returns raw 32-byte Ed25519 hex, not DER — it becomes `seedIdentifier`
 * and feeds `PublicKey.fromString` in coin-hedera's `combine()`.
 */
export function buildHederaSigner(): HederaSigner {
  return {
    async getPublicKey(_path: string): Promise<string> {
      const raw = OPERATOR_KEY.publicKey.toStringRaw();
      if (raw.length !== 64) {
        throw new Error(
          `hedera tester signer: expected a 64-char raw Ed25519 public key, got ${raw.length} chars — the SDK may have changed its default encoding to DER`,
        );
      }
      return raw;
    },
    async signTransaction(transaction: Uint8Array): Promise<Uint8Array> {
      return OPERATOR_KEY.sign(transaction);
    },
  };
}
