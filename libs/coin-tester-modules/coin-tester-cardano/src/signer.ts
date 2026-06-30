import { Bip32PrivateKey } from "@stricahq/bip32ed25519";
import * as cbors from "@stricahq/cbors";
import {
  crypto as TyphonCrypto,
  address as TyphonAddress,
  types as TyphonTypes,
} from "@stricahq/typhonjs";
import { mnemonicToEntropy } from "bip39";
import { Buffer } from "buffer";

const HARDENED = 0x80000000;
// Fixed mnemonic → deterministic addresses/keys across runs (all-zero entropy test vector).
const MNEMONIC =
  "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
// Cardano stake key lives at chain=2, index=0 of the account (CIP-1852).
const STAKE_CHAIN = 2;
const STAKE_INDEX = 0;

function parsePath(path: string): number[] {
  return path
    .replace(/^m\//, "")
    .split("/")
    .map(seg =>
      seg.endsWith("'") ? Number.parseInt(seg, 10) + HARDENED : Number.parseInt(seg, 10),
    );
}

export type CardanoTesterSigner = {
  /** @returns the Shelley base address (bech32) + the raw 32-byte ed25519 payment public key (hex). */
  getAddress: (path: string, networkId: number) => Promise<{ address: string; publicKey: string }>;
  /** Signs the unsigned tx's body hash, returning the 64-byte ed25519 signature (hex) for {@link combine}. */
  signTransaction: (path: string, unsignedTxHex: string) => Promise<string>;
};

export async function buildSigner(): Promise<CardanoTesterSigner> {
  const rootKey = await Bip32PrivateKey.fromEntropy(
    Buffer.from(mnemonicToEntropy(MNEMONIC), "hex"),
  );

  const deriveKey = (segments: number[]): Bip32PrivateKey =>
    segments.reduce<Bip32PrivateKey>((key, index) => key.derive(index), rootKey);

  // Credential = 28-byte blake2b hash of the public key; combine's witness wants the raw 32-byte key.
  const credentialHash = (key: Bip32PrivateKey): Buffer =>
    key.toBip32PublicKey().toPublicKey().hash();
  const rawPublicKey = (key: Bip32PrivateKey): Buffer =>
    Buffer.from(key.toBip32PublicKey().toPublicKey().toBytes());

  return {
    getAddress: async (path, networkId) => {
      const segments = parsePath(path);
      const paymentKey = deriveKey(segments);
      const stakeKey = deriveKey([...segments.slice(0, 3), STAKE_CHAIN, STAKE_INDEX]);
      const address = new TyphonAddress.BaseAddress(
        networkId,
        { hash: credentialHash(paymentKey), type: TyphonTypes.HashType.ADDRESS },
        { hash: credentialHash(stakeKey), type: TyphonTypes.HashType.ADDRESS },
      );
      return { address: address.getBech32(), publicKey: rawPublicKey(paymentKey).toString("hex") };
    },
    signTransaction: async (path, unsignedTxHex) => {
      const { value } = cbors.Decoder.decode(Buffer.from(unsignedTxHex, "hex"));
      const body = (value as unknown[])[0];
      const bodyHash = TyphonCrypto.hash32(cbors.Encoder.encode(body));
      return deriveKey(parsePath(path)).toPrivateKey().sign(bodyHash).toString("hex");
    },
  };
}
