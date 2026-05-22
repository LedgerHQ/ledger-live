import { crypto as lkrpCrypto } from "@ledgerhq/hw-ledger-key-ring-protocol";

const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_SALT_BYTES = 16;

export function generatePasswordSalt(): string {
  return Buffer.from(globalThis.crypto.getRandomValues(new Uint8Array(PBKDF2_SALT_BYTES))).toString(
    "hex",
  );
}

export async function deriveWrappingKey(password: string, saltHex: string): Promise<CryptoKey> {
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
  if (hex.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(hex)) {
    throw new Error(`Invalid hex string (length=${hex.length}): expected even-length hex digits.`);
  }
  const result = new Uint8Array(hex.length / 2);
  for (let i = 0; i < result.length; i++) {
    result[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return result;
}

const DOMAIN_SALT = new TextEncoder().encode("wallet-cli-domain-v1");

export async function deriveDomainKey(
  walletSyncEncryptionKey: string,
  domain: string,
): Promise<CryptoKey> {
  const ikm = hexToBytes(walletSyncEncryptionKey);
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
export async function encryptData(key: CryptoKey, plaintext: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const ct = await globalThis.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  const result = new Uint8Array(12 + ct.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(ct), 12);
  return result;
}

export async function decryptData(key: CryptoKey, ciphertext: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  if (ciphertext.length < 12) {
    throw new Error("Invalid ciphertext: too short to contain IV.");
  }
  const iv = ciphertext.slice(0, 12);
  const ct = ciphertext.slice(12);
  try {
    const pt = await globalThis.crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
    return new Uint8Array(pt);
  } catch {
    throw new Error("Decryption failed: wrong key or corrupted data.");
  }
}
