import { deriveAddress, deriveKeypair, generateSeed, sign } from "ripple-keypairs";
import type { XrpSigner } from "@ledgerhq/live-common/families/xrp/types";

/**
 * XRP transaction signing prefix (single-account signing).
 * Prepended to the encoded transaction blob before hashing with SHA-512Half.
 * @see https://xrpl.org/docs/concepts/transactions/#signing-and-submitting-transactions
 */
const TX_SIGN_PREFIX = "53545800";

/** A key pair that signs in-process, outside the coin module under test. */
export type XrplWallet = { address: string; publicKey: string; privateKey: string };

export function makeWallet(): XrplWallet {
  const seed = generateSeed({ algorithm: "ecdsa-secp256k1" });
  const { publicKey, privateKey } = deriveKeypair(seed);

  return { publicKey, privateKey, address: deriveAddress(publicKey) };
}

/**
 * Builds a deterministic software signer implementing `XrpSigner` for `wallet`.
 * Uses secp256k1 (the XRP default) regardless of the `ed25519` flag.
 */
export function buildXrpSigner(wallet: XrplWallet = makeWallet()): XrpSigner {
  const { publicKey, privateKey, address } = wallet;

  return {
    async getAddress(_path: string, _display?: boolean, _chainCode?: boolean, _ed25519?: boolean) {
      return { publicKey, address };
    },
    async signTransaction(_path: string, rawTxHex: string, _ed25519?: boolean) {
      return sign(TX_SIGN_PREFIX + rawTxHex, privateKey);
    },
  };
}
