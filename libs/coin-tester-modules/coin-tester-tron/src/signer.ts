import { secp256k1 } from "@noble/curves/secp256k1";
import { keccak_256 } from "@noble/hashes/sha3";
import { sha256 } from "@noble/hashes/sha2";
import { randomBytes } from "@noble/hashes/utils";
import bs58 from "bs58";
import { generateMnemonic, mnemonicToSeedSync } from "bip39";
import type { TronSigner, TronAddress, TronSignature } from "@ledgerhq/coin-tron/types/signer";
import type { TronFrameworkSigner } from "@ledgerhq/live-common/bridge/generic-coin-framework/families/tron/signer";

export type TronTestSigner = TronSigner & {
  readonly address: string;
  readonly publicKey: string;
  readonly privateKey: Uint8Array;
  readonly framework: TronFrameworkSigner;
};

function hexlify(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("hex");
}

function deriveAddress(publicKeyUncompressed: Uint8Array): string {
  const hash = keccak_256(publicKeyUncompressed.slice(1));
  const addr20 = hash.slice(-20);
  const addr21 = new Uint8Array(21);
  addr21[0] = 0x41;
  addr21.set(addr20, 1);
  const checksum = sha256(sha256(addr21)).slice(0, 4);
  const full = new Uint8Array(25);
  full.set(addr21);
  full.set(checksum, 21);
  return bs58.encode(full);
}

function signRawDataHex(rawDataHex: string, privateKey: Uint8Array): TronSignature {
  const hash = sha256(Buffer.from(rawDataHex, "hex"));
  const sig = secp256k1.sign(hash, privateKey, { lowS: true });
  const out = new Uint8Array(65);
  out.set(sig.toCompactRawBytes(), 0);
  out[64] = sig.recovery ?? 0;
  return hexlify(out);
}

export function buildTronTestSigner(privateKey?: Uint8Array): TronTestSigner {
  const priv = privateKey ?? randomBytes(32);
  const pub = secp256k1.getPublicKey(priv, false);
  const address = deriveAddress(pub);
  const publicKey = hexlify(pub);

  const signer: TronSigner = {
    async getAddress(_path: string, _boolDisplay?: boolean): Promise<TronAddress> {
      return { publicKey, address };
    },
    async sign(
      _path: string,
      rawTxHex: string,
      _tokenSignatures: string[],
    ): Promise<TronSignature> {
      return signRawDataHex(rawTxHex, priv);
    },
  };

  const framework: TronFrameworkSigner = {
    async getAddress(_path, _opts) {
      return { address, publicKey };
    },
    async signTransaction(_path, rawTxHex, _opts) {
      return signRawDataHex(rawTxHex, priv);
    },
  };

  return Object.assign(signer, { address, publicKey, privateKey: priv, framework });
}

export function buildTronTestSignerFromPrivateKeyHex(privateKeyHex: string): TronTestSigner {
  const clean = privateKeyHex.startsWith("0x") ? privateKeyHex.slice(2) : privateKeyHex;
  return buildTronTestSigner(Uint8Array.from(Buffer.from(clean, "hex")));
}

export function buildTronTestSignerFromMnemonic(mnemonic?: string): TronTestSigner {
  const phrase = mnemonic ?? generateMnemonic();
  const seed = mnemonicToSeedSync(phrase);
  return buildTronTestSigner(Uint8Array.from(seed.slice(0, 32)));
}
