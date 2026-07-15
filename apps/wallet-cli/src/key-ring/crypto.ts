import { crypto as lkrpCrypto } from "@ledgerhq/hw-ledger-key-ring-protocol";
import { isValidHex } from "../shared/hex";

// OWASP 2023 guidance for PBKDF2-HMAC-SHA256.
const PBKDF2_ITERATIONS = 600_000;
const PBKDF2_SALT_BYTES = 16;
// Shared with the session schema so persisted salts validate against the exact shape used here.
export const PASSWORD_SALT_RE = /^[0-9a-f]{32}$/;

export function generatePasswordSalt(): string {
  return Buffer.from(globalThis.crypto.getRandomValues(new Uint8Array(PBKDF2_SALT_BYTES))).toString(
    "hex",
  );
}

export async function deriveWrappingKey(password: string, saltHex: string): Promise<CryptoKey> {
  if (!PASSWORD_SALT_RE.test(saltHex)) {
    throw new Error(
      "Corrupt session: password salt is malformed. Run `wallet-cli ring destroy` to reset.",
    );
  }
  const keyMaterial = await globalThis.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return globalThis.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: hexToBytes(saltHex),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export function pubkeyFromPrivatekey(privateHex: string): string {
  return lkrpCrypto.to_hex(lkrpCrypto.keypairFromSecretKey(hexToBytes(privateHex)).publicKey);
}

export function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  if (!isValidHex(hex)) {
    throw new Error(`Invalid hex string (length=${hex.length}): expected even-length hex digits.`);
  }
  return Uint8Array.from(Buffer.from(hex, "hex"));
}

const DOMAIN_SALT = new TextEncoder().encode("wallet-cli-domain-v1");

export async function deriveDomainKey(
  walletSyncEncryptionKey: string,
  domain: string,
): Promise<CryptoKey> {
  const ikm = hexToBytes(walletSyncEncryptionKey);
  if (ikm.length === 0) {
    // Fail closed: an empty key derives a predictable AES key — a caller passed a meta-only
    // Trustchain (see trustchainFromMeta) without restoring it first.
    throw new Error("Refusing to derive a domain key from an empty wallet-sync encryption key.");
  }
  const hkdfKey = await globalThis.crypto.subtle.importKey("raw", ikm, "HKDF", false, [
    "deriveBits",
  ]);
  const bits = await globalThis.crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: DOMAIN_SALT,
      info: new TextEncoder().encode(domain),
    },
    hkdfKey,
    256,
  );
  return globalThis.crypto.subtle.importKey("raw", bits, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

/** Wire format: [iv (12 bytes)][ciphertext] */
export async function encryptData(
  key: CryptoKey,
  plaintext: Uint8Array<ArrayBuffer>,
): Promise<Uint8Array<ArrayBuffer>> {
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const ct = await globalThis.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  const result = new Uint8Array(12 + ct.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(ct), 12);
  return result;
}

export async function decryptData(
  key: CryptoKey,
  ciphertext: Uint8Array<ArrayBuffer>,
): Promise<Uint8Array<ArrayBuffer>> {
  if (ciphertext.length < 12) {
    throw new Error("Invalid ciphertext: too short to contain IV.");
  }
  const iv = ciphertext.slice(0, 12);
  const ct = ciphertext.slice(12);
  try {
    const pt = await globalThis.crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
    return new Uint8Array(pt);
  } catch {
    throw new Error(
      "Decryption failed: wrong key name, corrupted data, or the Ledger Key Ring rotated " +
        "(removing a ring member changes the encryption key and invalidates data encrypted before the rotation).",
    );
  }
}
