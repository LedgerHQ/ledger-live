import { secp256k1 } from "@noble/curves/secp256k1";
import { BIP32Factory } from "bip32";
import hmac from "create-hmac";
import * as crypto from "crypto";

import { Crypto, KeyPair, KeyPairWithChainCode } from "./Crypto";

// ECC wrapper for @noble/curves/secp256k1 to be compatible with BIP32Factory
const eccWrapper = {
  isPoint(point: Uint8Array | Buffer): boolean {
    try {
      const pointBytes = point instanceof Buffer ? new Uint8Array(point) : point;
      if (pointBytes.length !== 33 && pointBytes.length !== 65) return false;
      secp256k1.ProjectivePoint.fromHex(pointBytes);
      return true;
    } catch {
      return false;
    }
  },

  isPrivate(privateKey: Uint8Array | Buffer): boolean {
    try {
      const keyBytes = privateKey instanceof Buffer ? new Uint8Array(privateKey) : privateKey;
      if (keyBytes.length !== 32) return false;
      return secp256k1.utils.isValidPrivateKey(keyBytes);
    } catch {
      return false;
    }
  },

  pointFromScalar(privateKey: Uint8Array | Buffer, compressed = true): Uint8Array | null {
    try {
      const keyBytes = privateKey instanceof Buffer ? new Uint8Array(privateKey) : privateKey;
      if (!this.isPrivate(keyBytes)) return null;
      return secp256k1.getPublicKey(keyBytes, compressed);
    } catch {
      return null;
    }
  },

  pointAddScalar(
    point: Uint8Array | Buffer,
    scalar: Uint8Array | Buffer,
    compressed?: boolean,
  ): Uint8Array | null {
    try {
      const pointBytes = point instanceof Buffer ? new Uint8Array(point) : point;
      const scalarBytes = scalar instanceof Buffer ? new Uint8Array(scalar) : scalar;

      if (!this.isPoint(pointBytes) || !this.isPrivate(scalarBytes)) return null;

      const p = secp256k1.ProjectivePoint.fromHex(pointBytes);
      const scalarBigInt = bytesToBigInt(scalarBytes);
      const scalarPoint = secp256k1.ProjectivePoint.BASE.multiply(scalarBigInt);
      const result = p.add(scalarPoint);

      const isCompressed = compressed !== undefined ? compressed : pointBytes.length === 33;
      return result.toRawBytes(isCompressed);
    } catch {
      return null;
    }
  },

  privateAdd(privateKey: Uint8Array | Buffer, scalar: Uint8Array | Buffer): Uint8Array | null {
    try {
      const keyBytes = privateKey instanceof Buffer ? new Uint8Array(privateKey) : privateKey;
      const scalarBytes = scalar instanceof Buffer ? new Uint8Array(scalar) : scalar;

      if (!this.isPrivate(keyBytes) || !this.isPrivate(scalarBytes)) return null;

      const keyBigInt = bytesToBigInt(keyBytes);
      const scalarBigInt = bytesToBigInt(scalarBytes);
      const CURVE_ORDER = BigInt(
        "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141",
      );
      const result = (keyBigInt + scalarBigInt) % CURVE_ORDER;

      if (result === 0n) return null;

      return bigIntToBytes(result);
    } catch {
      return null;
    }
  },

  pointMultiply(
    point: Uint8Array | Buffer,
    scalar: Uint8Array | Buffer,
    compressed?: boolean,
  ): Uint8Array | null {
    try {
      const pointBytes = point instanceof Buffer ? new Uint8Array(point) : point;
      const scalarBytes = scalar instanceof Buffer ? new Uint8Array(scalar) : scalar;

      if (!this.isPoint(pointBytes) || !this.isPrivate(scalarBytes)) return null;

      const p = secp256k1.ProjectivePoint.fromHex(pointBytes);
      const scalarBigInt = bytesToBigInt(scalarBytes);
      const result = p.multiply(scalarBigInt);

      const isCompressed = compressed !== undefined ? compressed : pointBytes.length === 33;
      return result.toRawBytes(isCompressed);
    } catch {
      return null;
    }
  },

  pointCompress(point: Uint8Array | Buffer, compressed = true): Uint8Array {
    const pointBytes = point instanceof Buffer ? new Uint8Array(point) : point;
    const p = secp256k1.ProjectivePoint.fromHex(pointBytes);
    return p.toRawBytes(compressed);
  },

  isPointCompressed(point: Uint8Array | Buffer): boolean {
    return point.length === 33;
  },

  // Additional utilities for compatibility with TinySecp256k1Interface
  sign(hash: Uint8Array | Buffer, privateKey: Uint8Array | Buffer): Uint8Array {
    const hashBytes = hash instanceof Buffer ? new Uint8Array(hash) : hash;
    const keyBytes = privateKey instanceof Buffer ? new Uint8Array(privateKey) : privateKey;
    const signature = secp256k1.sign(hashBytes, keyBytes, { prehash: false });
    return signature.toCompactRawBytes();
  },

  verify(
    hash: Uint8Array | Buffer,
    publicKey: Uint8Array | Buffer,
    signature: Uint8Array | Buffer,
  ): boolean {
    try {
      const hashBytes = hash instanceof Buffer ? new Uint8Array(hash) : hash;
      const pubKeyBytes = publicKey instanceof Buffer ? new Uint8Array(publicKey) : publicKey;
      const sigBytes = signature instanceof Buffer ? new Uint8Array(signature) : signature;
      return secp256k1.verify(sigBytes, hashBytes, pubKeyBytes, { prehash: false });
    } catch {
      return false;
    }
  },
};

// Helper functions for bigint conversion
function bytesToBigInt(bytes: Uint8Array): bigint {
  const hex = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
  return BigInt("0x" + hex);
}

function bigIntToBytes(value: bigint): Uint8Array {
  const hex = value.toString(16).padStart(64, "0");
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

const bip32 = BIP32Factory(eccWrapper);
const AES_BLOCK_SIZE = 16;
const PRIVATE_KEY_SIZE = 32;

export class NobleCryptoSecp256k1 implements Crypto {
  randomKeypair(): KeyPair {
    let pk: Uint8Array;
    do {
      pk = crypto.randomBytes(PRIVATE_KEY_SIZE);
    } while (!secp256k1.utils.isValidPrivateKey(pk));
    return this.keypairFromSecretKey(pk);
  }

  derivePrivate(xpriv: Uint8Array, path: number[]): KeyPairWithChainCode {
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

  keypairFromSecretKey(secretKey: Uint8Array): KeyPair {
    return {
      publicKey: secp256k1.getPublicKey(secretKey, true), // compressed by default
      privateKey: secretKey,
    };
  }

  private derEncode(R: Uint8Array, S: Uint8Array): Uint8Array {
    if (R[0] > 0x7f) {
      R = this.concat(new Uint8Array([0x00]), R);
    }
    if (S[0] > 0x7f) {
      S = this.concat(new Uint8Array([0x00]), S);
    }
    R = this.concat(new Uint8Array([0x02, R.length]), R);
    S = this.concat(new Uint8Array([0x02, S.length]), S);
    const prefix = new Uint8Array([0x30, R.length + S.length]);
    return this.concat(prefix, this.concat(R, S));
  }

  private derDecode(signature: Uint8Array): { R: Uint8Array; S: Uint8Array } {
    const R: Uint8Array = signature.slice(4, 4 + signature[3]);
    const S: Uint8Array = signature.slice(
      6 + signature[3],
      6 + signature[3] + signature[5 + signature[3]],
    );
    return {
      R: this.enforceLength(R, PRIVATE_KEY_SIZE),
      S: this.enforceLength(S, PRIVATE_KEY_SIZE),
    };
  }

  sign(message: Uint8Array, keyPair: KeyPair): Uint8Array {
    // Note: Using prehash: false since we're passing already hashed message
    const signature = secp256k1.sign(message, keyPair.privateKey, { prehash: false });
    const compactSig = signature.toCompactRawBytes();
    // DER encoding
    return this.derEncode(compactSig.slice(0, 32), compactSig.slice(32, 64));
  }

  verify(message: Uint8Array, signature: Uint8Array, publicKey: Uint8Array): boolean {
    try {
      // DER decoding
      const { R, S } = this.derDecode(signature);
      const compactSig = this.concat(R, S);
      return secp256k1.verify(compactSig, message, publicKey, { prehash: false });
    } catch {
      return false;
    }
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

  private enforceLength(buffer: Uint8Array, length: number): Uint8Array {
    if (buffer.length > length) {
      return buffer.slice(buffer.length - length); // truncate extra bytes from the start
    } else if (buffer.length < length) {
      const padded = new Uint8Array(length);
      const start = length - buffer.length;
      padded.set(Array(start).fill(0));
      padded.set(buffer, start);
      return padded;
    }
    return buffer;
  }

  encrypt(secret: Uint8Array, nonce: Uint8Array, message: Uint8Array): Uint8Array {
    const normalizedSecret = this.normalizeKey(secret);
    const normalizeNonce = this.normalizeNonce(nonce);
    const cipher = crypto.createCipheriv("aes-256-gcm", normalizedSecret, normalizeNonce);
    cipher.setAutoPadding(false);
    let result = cipher.update(this.to_hex(message), "hex", "hex");
    result += cipher.final("hex");
    const bytes = this.from_hex(result);
    return this.concat(bytes, cipher.getAuthTag());
  }

  decrypt(secret: Uint8Array, nonce: Uint8Array, ciphertext: Uint8Array): Uint8Array {
    const normalizedSecret = this.normalizeKey(secret);
    const normalizeNonce = this.normalizeNonce(nonce);
    const encryptedData = ciphertext.slice(0, ciphertext.length - AES_BLOCK_SIZE);
    const authTag = ciphertext.slice(encryptedData.length);
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
  encryptUserData(commandStreamPrivateKey: Uint8Array, data: Uint8Array): Uint8Array {
    // Generate ephemeral key pair
    const ephemeralKeypair = this.randomKeypair();

    // Derive the shared secret using ECDH
    const sharedSecret = this.ecdh(
      this.keypairFromSecretKey(commandStreamPrivateKey),
      ephemeralKeypair.publicKey,
    );

    // Normalize the shared secret to be used as AES key
    const aesKey = this.computeSymmetricKey(sharedSecret, new Uint8Array());

    // Generate a random IV (nonce)
    const iv = crypto.randomBytes(16);

    // Encrypt the data using AES-256-GCM
    const cipher = crypto.createCipheriv("aes-256-gcm", aesKey, iv);
    let encryptedData = cipher.update(data);
    encryptedData = Buffer.concat([encryptedData, cipher.final()]);
    const tag = cipher.getAuthTag();

    // Serialize the format
    const result = new Uint8Array(
      1 + ephemeralKeypair.publicKey.length + iv.length + tag.length + encryptedData.length,
    );
    result[0] = 0x00; // Version of the format
    result.set(ephemeralKeypair.publicKey, 1);
    result.set(iv, 34);
    result.set(tag, 50);
    result.set(encryptedData, 66);

    return result;
  }

  decryptUserData(commandStreamPrivateKey: Uint8Array, data: Uint8Array): Uint8Array {
    const version = data[0];
    if (version !== 0x00) {
      throw new Error("Unsupported format version");
    }
    const ephemeralPublicKey = data.slice(1, 34);
    const iv = data.slice(34, 50);
    const tag = data.slice(50, 66);
    const encryptedData = data.slice(66);

    // Derive the shared secret using ECDH
    const sharedSecret = this.ecdh(
      this.keypairFromSecretKey(commandStreamPrivateKey),
      ephemeralPublicKey,
    );

    // Normalize the shared secret to be used as AES key
    const aesKey = this.computeSymmetricKey(sharedSecret, new Uint8Array());

    // Decrypt the data using AES-256-GCM
    const decipher = crypto.createDecipheriv("aes-256-gcm", aesKey, iv);
    decipher.setAuthTag(tag);
    let decryptedData = decipher.update(encryptedData);
    decryptedData = Buffer.concat([decryptedData, decipher.final()]);
    return new Uint8Array(decryptedData.buffer, decryptedData.byteOffset, decryptedData.byteLength);
  }

  randomBytes(size: number): Uint8Array {
    return crypto.randomBytes(size);
  }

  ecdh(keyPair: KeyPair, publicKey: Uint8Array): Uint8Array {
    const point = secp256k1.ProjectivePoint.fromHex(publicKey);
    const scalar = bytesToBigInt(keyPair.privateKey);
    const result = point.multiply(scalar);
    // Return x coordinate only (32 bytes) - remove first byte which is 0x04 for uncompressed, then take only x
    const fullPoint = result.toRawBytes(false).slice(1); // Remove 0x04 prefix -> 64 bytes
    return fullPoint.slice(0, 32); // Take only x coordinate -> 32 bytes
  }

  computeSymmetricKey(privateKey: Uint8Array, extra: Uint8Array) {
    const digest = hmac("sha256", Buffer.from(extra)).update(Buffer.from(privateKey)).digest();
    return digest;
  }

  hash(message: Uint8Array): Uint8Array {
    return crypto.createHash("sha256").update(Buffer.from(message)).digest();
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
