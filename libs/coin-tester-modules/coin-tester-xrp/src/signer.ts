import { deriveAddress, deriveKeypair, generateSeed, sign } from "ripple-keypairs";
import type { XrpSigner } from "@ledgerhq/live-common/families/xrp/types";

/**
 * XRP transaction signing prefix (single-account signing).
 * Prepended to the encoded transaction blob before hashing with SHA-512Half.
 * @see https://xrpl.org/docs/concepts/transactions/#signing-and-submitting-transactions
 */
const TX_SIGN_PREFIX = "53545800";

/**
 * Builds a deterministic software signer implementing `XrpSigner`.
 * Uses secp256k1 (the XRP default) regardless of the `ed25519` flag.
 */
export function buildXrpSigner(): XrpSigner {
  const seed = generateSeed({ algorithm: "ecdsa-secp256k1" });
  const { publicKey, privateKey } = deriveKeypair(seed);
  const address = deriveAddress(publicKey);

  return {
    async getAddress(_path: string, _display?: boolean, _chainCode?: boolean, _ed25519?: boolean) {
      return { publicKey, address };
    },
    async signTransaction(_path: string, rawTxHex: string, _ed25519?: boolean) {
      return sign(TX_SIGN_PREFIX + rawTxHex, privateKey);
    },
  };
}
