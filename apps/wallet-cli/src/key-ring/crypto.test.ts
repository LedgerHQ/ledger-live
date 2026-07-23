import { describe, it, expect } from "bun:test";
import {
  hexToBytes,
  pubkeyFromPrivatekey,
  deriveDomainKey,
  deriveWrappingKey,
  encryptData,
  decryptData,
} from "./crypto";

const KEY_HEX = "cafe".repeat(16);
const SALT_HEX = "0".repeat(32);

describe("hexToBytes", () => {
  it("converts valid hex", () =>
    expect(hexToBytes("ff00ab")).toEqual(new Uint8Array([0xff, 0x00, 0xab])));
  it("handles empty string", () => expect(hexToBytes("")).toEqual(new Uint8Array(0)));
  it("throws on odd-length hex", () => expect(() => hexToBytes("abc")).toThrow());
  it("throws on non-hex characters", () => expect(() => hexToBytes("zz")).toThrow());
});

describe("pubkeyFromPrivatekey", () => {
  const PRIVATE = "0101010101010101010101010101010101010101010101010101010101010101";
  it("returns a 66-char compressed pubkey hex", () =>
    expect(pubkeyFromPrivatekey(PRIVATE)).toMatch(/^[0-9a-f]{66}$/));
  it("is deterministic", () =>
    expect(pubkeyFromPrivatekey(PRIVATE)).toBe(pubkeyFromPrivatekey(PRIVATE)));
  it("throws on invalid hex", () => expect(() => pubkeyFromPrivatekey("not-hex")).toThrow());
});

describe("encryptData / decryptData", () => {
  it("round-trip restores plaintext", async () => {
    const key = await deriveDomainKey(KEY_HEX, "domain");
    const pt = new TextEncoder().encode("hello world");
    const ct = await encryptData(key, pt);
    expect(ct.length).toBe(12 + pt.length + 16); // IV + plaintext + GCM tag
    expect(new TextDecoder().decode(await decryptData(key, ct))).toBe("hello world");
  });

  it("different domains produce different keys", async () => {
    const k1 = await deriveDomainKey(KEY_HEX, "domain-a");
    const k2 = await deriveDomainKey(KEY_HEX, "domain-b");
    const ct = await encryptData(k1, new TextEncoder().encode("secret"));
    await expect(decryptData(k2, ct)).rejects.toThrow("Decryption failed");
  });

  it("decryptData throws on truncated ciphertext", async () =>
    expect(decryptData(await deriveDomainKey(KEY_HEX, "x"), new Uint8Array(5))).rejects.toThrow(
      "too short",
    ));
});

describe("deriveDomainKey", () => {
  it("fails closed on empty key material", async () =>
    expect(deriveDomainKey("", "domain")).rejects.toThrow("empty wallet-sync encryption key"));
});

describe("deriveWrappingKey", () => {
  it("derives a key from a well-formed salt", async () =>
    expect(await deriveWrappingKey("pw", SALT_HEX)).toBeDefined());
  it("rejects a malformed salt", async () =>
    expect(deriveWrappingKey("pw", "not-a-valid-salt")).rejects.toThrow(
      "password salt is malformed",
    ));
});
