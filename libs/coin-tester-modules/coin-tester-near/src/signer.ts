import { createHash } from "node:crypto";
import { utils } from "near-api-js";
import type { KeyPair } from "near-api-js/lib/utils/key_pair";
import type { NearSigner } from "@ledgerhq/coin-near/signer";

// Same Borsh-serialized transaction, different shape per caller: base64 in / hex out for the framework, raw bytes / Buffer for the account bridge.
export type FrameworkNearSigner = {
  getAddress(
    path: string,
    options?: { verify?: boolean },
  ): Promise<{ path: string; address: string; publicKey: string }>;
  signTransaction(path: string, unsigned: string): Promise<string>;
};

export type Signers = {
  bridge: NearSigner;
  coinframework: FrameworkNearSigner;
  keyPair: KeyPair;
  publicKey: string;
};

// NEAR signs the sha256 of the serialized transaction, not the raw bytes (verified against near-api-js).
function sign(keyPair: KeyPair, serialized: Uint8Array): Buffer {
  const digest = createHash("sha256").update(serialized).digest();
  return Buffer.from(keyPair.sign(digest).signature);
}

// accountId is fixed rather than derived: NEAR account ids are names, not hashes of a public key.
export function buildSigners(accountId: string, keyPair: KeyPair): Signers {
  const publicKey = keyPair.getPublicKey().toString();

  const bridge: NearSigner = {
    getAddress: async () => ({ address: accountId, publicKey }),
    signTransaction: async (transaction: Uint8Array) => sign(keyPair, transaction),
  };

  const coinframework: FrameworkNearSigner = {
    getAddress: async (path: string) => ({ path, address: accountId, publicKey }),
    signTransaction: async (_path: string, unsigned: string) =>
      sign(keyPair, Buffer.from(unsigned, "base64")).toString("hex"),
  };

  return { bridge, coinframework, keyPair, publicKey };
}

/** A fresh key per run; account ids stay fixed, so scenarios remain reproducible. */
export function randomKeyPair(): KeyPair {
  return utils.KeyPair.fromRandom("ed25519");
}
