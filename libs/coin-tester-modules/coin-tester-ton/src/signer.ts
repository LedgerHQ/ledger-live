import { Cell } from "@ton/core";
import { type KeyPair, keyPairFromSeed, sha256_sync, sign } from "@ton/crypto";
import { WalletContractV4 } from "@ton/ton";

/**
 * Plays the device for the generic adapter. `signTransaction` gets coin-ton's crafted wallet-v4
 * body (BOC, base64) and returns the ed25519 signature over its hash, which `combine` checks
 * against the public key: the Ledger app signs the same hash.
 */
export type TonSoftwareSigner = {
  getAddress: (path: string) => Promise<{ path: string; address: string; publicKey: string }>;
  signTransaction: (path: string, unsigned: string) => Promise<string>;
};

/** One key per derivation path, the same on every run. */
export const keyPairAt = (path: string): KeyPair =>
  keyPairFromSeed(sha256_sync(`coin-tester-ton/${path}`));

/** The v4 wallet of the key at `path`, in the non-bounceable form Ledger Live shows. */
export const walletAt = (path: string) =>
  WalletContractV4.create({ workchain: 0, publicKey: keyPairAt(path).publicKey });

export const friendlyAddressAt = (path: string): string =>
  walletAt(path).address.toString({ urlSafe: true, bounceable: false });

export function buildSigner(): TonSoftwareSigner {
  return {
    getAddress: async path => ({
      path,
      address: friendlyAddressAt(path),
      publicKey: keyPairAt(path).publicKey.toString("hex"),
    }),
    signTransaction: async (path, unsigned) =>
      sign(Cell.fromBase64(unsigned).hash(), keyPairAt(path).secretKey).toString("hex"),
  };
}
