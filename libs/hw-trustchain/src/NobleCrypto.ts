import * as secp from "@noble/secp256k1";
import * as ecc from "tiny-secp256k1";
import { BIP32Factory } from "bip32";
// import * as miscreant from 'miscreant';
import hmac from "create-hmac";
import * as crypto from "crypto";

import { Crypto, KeyPair, KeyPairWithChainCode } from "./Crypto";

const bip32 = BIP32Factory(ecc);

const USE_AES_GCM = false;
const AES_BLOCK_SIZE = 16;

export class NobleCryptoSecp256k1 implements Crypto {
  async randomKeypair(): Promise<KeyPair> {
    const pk = secp.utils.randomPrivateKey();
    return this.keypairFromSecretKey(pk);
  }

  async derivePrivate(xpriv: Uint8Array, path: number[]): Promise<KeyPairWithChainCode> {
    const pk = xpriv.slice(0, 32);
    const chainCode = xpriv.slice(32);
    let node = bip32.fromPrivateKey(Buffer.from(pk), Buffer.from(chainCode));
    for (const index of path) {
      node = node.derive(index);
    }
    return {
      publicKey: this.to_array(node.publicKey),
      privateKey: this.to_array(node.privateKey!),
      chainCode: this.to_array(node.chainCode),
    };
  }

  async keypairFromSecretKey(secretKey: Uint8Array): Promise<KeyPair> {
    return {
      publicKey: secp.getPublicKey(secretKey, true),
      privateKey: secretKey,
    };
  }

  sign(message: Uint8Array, keyPair: KeyPair): Promise<Uint8Array> {
    return secp.sign(message, keyPair.privateKey);
  }

  async verify(
    message: Uint8Array,
    signature: Uint8Array,
    publicKey: Uint8Array,
  ): Promise<boolean> {
    return secp.verify(signature, message, publicKey);
  }

  private to_array(buffer: Buffer): Uint8Array {
    return new Uint8Array(buffer);
  }

  private normalizeKey(key: Uint8Array): Uint8Array {
    if (key.length === 32) {
      return key;
    }
    throw new Error("Invalid key length for AES-256 " + `(invalid length is ${key.length})`);
  }

  private normalizeNonce(nonce: Uint8Array): Uint8Array {
    if (nonce.length < 16) {
      throw new Error(
        "Invalid nonce length (must be 128bits) " + `(invalid length is ${nonce.length})`,
      );
    }
    return nonce.slice(0, 16);
  }

  private concat(a: Uint8Array, b: Uint8Array): Uint8Array {
    const c = new Uint8Array(a.length + b.length);
    c.set(a);
    c.set(b, a.length);
    return c;
  }

  private pad(message: Uint8Array): Uint8Array {
    // ISO9797M2 implementation
    const padLength = AES_BLOCK_SIZE - (message.length % AES_BLOCK_SIZE);
    if (padLength === AES_BLOCK_SIZE) {
      return message;
    }
    const padding = new Uint8Array(padLength);
    padding[0] = 0x80;
    padding.fill(0, 1);
    return this.concat(message, padding);
  }

  private unpad(message: Uint8Array): Uint8Array {
    // ISO9797M2 implementation
    for (let i = message.length - 1; i >= 0; i--) {
      if (message[i] === 0x80) {
        return message.slice(0, i);
      }
      if (message[i] !== 0x00) {
        return message;
      }
    }
    throw new Error("Invalid padding");
  }

  async encrypt(secret: Uint8Array, nonce: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
    if (USE_AES_GCM) {
      return this.encryptUsingAesGcm(secret, nonce, message);
    }
    const normalizedSecret = this.normalizeKey(secret);
    const normalizeNonce = this.normalizeNonce(nonce);
    const cipher = crypto.createCipheriv("aes-256-cbc", normalizedSecret, normalizeNonce);
    message = this.pad(message);
    cipher.setAutoPadding(false);
    let result = cipher.update(this.to_hex(message), "hex", "hex");
    result += cipher.final("hex");
    const bytes = this.from_hex(result);
    return bytes;
  }

  async encryptUsingAesGcm(
    secret: Uint8Array,
    nonce: Uint8Array,
    message: Uint8Array,
  ): Promise<Uint8Array> {
    const normalizedSecret = this.normalizeKey(secret);
    const normalizeNonce = this.normalizeNonce(nonce);
    const cipher = crypto.createCipheriv("aes-256-gcm", normalizedSecret, normalizeNonce);
    cipher.setAutoPadding(true);
    let result = cipher.update(this.to_hex(message), "hex", "hex");
    result += cipher.final("hex");
    const bytes = this.from_hex(result);
    return this.concat(
      this.concat(new Uint8Array([cipher.getAuthTag()!.length]), cipher.getAuthTag()!),
      bytes,
    );
  }

  async decrypt(
    secret: Uint8Array,
    nonce: Uint8Array,
    ciphertext: Uint8Array,
  ): Promise<Uint8Array> {
    if (USE_AES_GCM) {
      return this.decryptUsingAesGcm(secret, nonce, ciphertext);
    }
    const normalizedSecret = this.normalizeKey(secret);
    const normalizeNonce = this.normalizeNonce(nonce);
    const decipher = crypto.createDecipheriv("aes-256-cbc", normalizedSecret, normalizeNonce);
    decipher.setAutoPadding(false);
    let result = decipher.update(this.to_hex(ciphertext), "hex", "hex");
    result += decipher.final("hex");
    const message = this.from_hex(result);
    return this.unpad(message);
  }

  async decryptUsingAesGcm(
    secret: Uint8Array,
    nonce: Uint8Array,
    ciphertext: Uint8Array,
  ): Promise<Uint8Array> {
    const normalizedSecret = this.normalizeKey(secret);
    const normalizeNonce = this.normalizeNonce(nonce);
    const tagLength = ciphertext[0];
    const authTag = ciphertext.slice(1, tagLength + 1);
    const encryptedData = ciphertext.slice(tagLength + 1);
    const decipher = crypto.createDecipheriv("aes-256-gcm", normalizedSecret, normalizeNonce);
    decipher.setAuthTag(authTag);
    let result = decipher.update(this.to_hex(encryptedData), "hex", "hex");
    result += decipher.final("hex");
    return this.from_hex(result);
  }

  async randomBytes(size: number): Promise<Uint8Array> {
    return secp.utils.randomBytes(size);
  }

  async ecdh(keyPair: KeyPair, publicKey: Uint8Array): Promise<Uint8Array> {
    const point = ecc.pointMultiply(
      publicKey,
      keyPair.privateKey,
      ecc.isPointCompressed(publicKey),
    )!;
    return point.slice(1);
    // ecc.pointMultiply(publicKey, keyPair.privateKey, false)
    // return secp.getSharedSecret(keyPair.privateKey, publicKey, false);
  }

  async computeSymmetricKey(privateKey: Uint8Array, extra: Uint8Array): Promise<Uint8Array> {
    const digest = hmac("sha256", Buffer.from(extra)).update(Buffer.from(privateKey)).digest();
    return digest;
  }

  hash(message: Uint8Array): Promise<Uint8Array> {
    return secp.utils.sha256(message);
  }

  from_hex(hex: string): Uint8Array {
    return Uint8Array.from(hex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  }

  to_hex(bytes?: Uint8Array | undefined | null): string {
    return to_hex(bytes);
  }
}

export function to_hex(bytes?: Uint8Array | undefined | null): string {
  if (!bytes) {
    return "";
  }
  return bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, "0"), "");
}
