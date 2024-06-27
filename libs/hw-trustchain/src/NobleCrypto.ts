import * as secp from "@noble/secp256k1";
import * as ecc from "tiny-secp256k1";
import { BIP32Factory } from "bip32";
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

  /**
   * Ledger Live data are encrypted following pattern based on ECIES.
   * For each encryption the Ledger Live instance generates a random keypair over secp256k1 (ephemeral public key)
   * and a 16 bytes IV. Ledger Live then perform an ECDH between the command stream public key and
   * the ephemeral private key to get the encryption key.
   * The data is then encrypted using AES-256-GCM and serialized using the following format:
1 byte : Version of the format (0x00)
33 bytes : Compressed ephemeral public key
16 bytes : Nonce/IV
16 bytes : Tag/MAC (from AES-256-GCM)
variable : Encrypted data
   */
  async encryptUserData(
    commandStreamPrivateKey: Uint8Array,
    data: Uint8Array,
  ): Promise<Uint8Array> {
    // Generate ephemeral key pair
    const ephemeralPrivateKey = secp.utils.randomPrivateKey();
    const ephemeralPublicKey = secp.getPublicKey(ephemeralPrivateKey, true);

    // Derive the shared secret using ECDH
    const sharedSecret = await this.ecdh(
      {
        privateKey: commandStreamPrivateKey,
        publicKey: secp.getPublicKey(commandStreamPrivateKey, true),
      },
      ephemeralPublicKey,
    );

    // Normalize the shared secret to be used as AES key
    const aesKey = await this.computeSymmetricKey(sharedSecret, new Uint8Array());

    // Generate a random IV (nonce)
    const iv = crypto.randomBytes(16);

    // Encrypt the data using AES-256-GCM
    const cipher = crypto.createCipheriv("aes-256-gcm", aesKey, iv);
    let encryptedData = cipher.update(data);
    encryptedData = Buffer.concat([encryptedData, cipher.final()]);
    const tag = cipher.getAuthTag();

    // Serialize the format
    const result = new Uint8Array(
      1 + ephemeralPublicKey.length + iv.length + tag.length + encryptedData.length,
    );
    result[0] = 0x00; // Version of the format
    result.set(ephemeralPublicKey, 1);
    result.set(iv, 34);
    result.set(tag, 50);
    result.set(encryptedData, 66);

    return result;
  }

  async decryptUserData(
    commandStreamPrivateKey: Uint8Array,
    data: Uint8Array,
  ): Promise<Uint8Array> {
    const version = data[0];
    if (version !== 0x00) {
      throw new Error("Unsupported format version");
    }
    const ephemeralPublicKey = data.slice(1, 34);
    const iv = data.slice(34, 50);
    const tag = data.slice(50, 66);
    const encryptedData = data.slice(66);

    // Derive the shared secret using ECDH
    const sharedSecret = await this.ecdh(
      {
        privateKey: commandStreamPrivateKey,
        publicKey: secp.getPublicKey(commandStreamPrivateKey, true),
      },
      ephemeralPublicKey,
    );

    // Normalize the shared secret to be used as AES key
    const aesKey = await this.computeSymmetricKey(sharedSecret, new Uint8Array());

    // Decrypt the data using AES-256-GCM
    const decipher = crypto.createDecipheriv("aes-256-gcm", aesKey, iv);
    decipher.setAuthTag(tag);
    let decryptedData = decipher.update(encryptedData);
    decryptedData = Buffer.concat([decryptedData, decipher.final()]);
    return new Uint8Array(decryptedData.buffer, decryptedData.byteOffset, decryptedData.byteLength);
  }

  async randomBytes(size: number): Promise<Uint8Array> {
    return secp.utils.randomBytes(size);
  }

  async ecdh(keyPair: KeyPair, publicKey: Uint8Array): Promise<Uint8Array> {
    const pubkey = Buffer.from(publicKey);
    const privkey = Buffer.from(keyPair.privateKey);
    const point = ecc.pointMultiply(pubkey, privkey, ecc.isPointCompressed(pubkey))!;
    return point.slice(1);
  }

  async computeSymmetricKey(privateKey: Uint8Array, extra: Uint8Array): Promise<Uint8Array> {
    const digest = hmac("sha256", Buffer.from(extra)).update(Buffer.from(privateKey)).digest();
    return digest;
  }

  hash(message: Uint8Array): Promise<Uint8Array> {
    return secp.utils.sha256(message);
  }

  from_hex(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex[i] + hex[i + 1], 16);
    }
    return bytes;
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
