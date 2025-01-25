import * as secp256k1 from "secp256k1";
import * as ecc from "tiny-secp256k1";
import { BIP32Factory } from "bip32";
import hmac from "create-hmac";
import * as crypto from "crypto";

import { Crypto, KeyPair, KeyPairWithChainCode } from "./Crypto";

const bip32 = BIP32Factory(ecc);
const AES_BLOCK_SIZE = 16;
const PRIVATE_KEY_SIZE = 32;

export class NobleCryptoSecp256k1 implements Crypto {
  randomKeypair(): KeyPair {
    let pk: Uint8Array;
    do {
      pk = crypto.randomBytes(PRIVATE_KEY_SIZE);
    } while (!secp256k1.privateKeyVerify(pk));
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
      publicKey: secp256k1.publicKeyCreate(secretKey),
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
    const signature = secp256k1.ecdsaSign(message, keyPair.privateKey).signature;
    // DER encoding
    return this.derEncode(signature.slice(0, 32), signature.slice(32, 64));
  }

  verify(message: Uint8Array, signature: Uint8Array, publicKey: Uint8Array): boolean {
    // DER decoding
    const { R, S } = this.derDecode(signature);
    return secp256k1.ecdsaVerify(this.concat(R, S), message, publicKey);
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
    const pubkey = Buffer.from(publicKey);
    const privkey = Buffer.from(keyPair.privateKey);
    const point = ecc.pointMultiply(pubkey, privkey, ecc.isPointCompressed(pubkey))!;
    return point.slice(1);
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
