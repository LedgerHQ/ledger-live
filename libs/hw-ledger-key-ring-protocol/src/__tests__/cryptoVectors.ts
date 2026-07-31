import { crypto } from "../Crypto";

/**
 * Golden vectors captured from the original `node:crypto` implementation.
 *
 * The other crypto tests only exercise round trips, which stay green even if the wire format
 * changes. These pin the actual bytes, because command-stream payloads and `encryptUserData`
 * envelopes are persisted to disk and synchronised between devices.
 *
 * Do not regenerate them to make a failing test pass: a mismatch means the change under test
 * is not backward compatible.
 */
const KEY = "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";
const NONCE = "a0a1a2a3a4a5a6a7a8a9aaabacadaeaf";
const MESSAGE = "48656c6c6f204c65646765722053796e6320210102030405";
// Fixed, publicly-known test scalar — not a real key.
const PRIVATE_KEY = "c0ffee00112233445566778899aabbccddeeff00112233445566778899aabbcc"; // gitleaks:allow

describe("crypto golden vectors (node:crypto compatibility)", () => {
  it("encrypts to the same ciphertext and tag", () => {
    const encrypted = crypto.encrypt(
      crypto.from_hex(KEY),
      crypto.from_hex(NONCE),
      crypto.from_hex(MESSAGE),
    );
    expect(crypto.to_hex(encrypted)).toBe(
      "62c64fd077ed8113a7f97ac3cd47f4fee16562787c3755a97d8af2dcdef60798db33ef18e4fdcc3d",
    );
  });

  it("decrypts a ciphertext produced by the original implementation", () => {
    const decrypted = crypto.decrypt(
      crypto.from_hex(KEY),
      crypto.from_hex(NONCE),
      crypto.from_hex(
        "62c64fd077ed8113a7f97ac3cd47f4fee16562787c3755a97d8af2dcdef60798db33ef18e4fdcc3d",
      ),
    );
    expect(crypto.to_hex(decrypted)).toBe(MESSAGE);
  });

  it("rejects a ciphertext whose auth tag has been tampered with", () => {
    const tampered = crypto.from_hex(
      "62c64fd077ed8113a7f97ac3cd47f4fee16562787c3755a97d8af2dcdef60798db33ef18e4fdcc3e",
    );
    expect(() => crypto.decrypt(crypto.from_hex(KEY), crypto.from_hex(NONCE), tampered)).toThrow();
  });

  it("hashes to the same digest", () => {
    expect(crypto.to_hex(crypto.hash(crypto.from_hex(MESSAGE)))).toBe(
      "7ed224c16c235d0c71f8ca97f7399727a5d5170f7cf534b483cff6e38bd8731e",
    );
  });

  it("computes the same symmetric key", () => {
    expect(
      crypto.to_hex(crypto.computeSymmetricKey(crypto.from_hex(KEY), crypto.from_hex("beef"))),
    ).toBe("bfb6f6d734fca9f995a2263018522bded68347b4d105633eebf7d7f8dcc17695");
  });

  it("computes the same symmetric key with empty extra data", () => {
    // This is the path `encryptUserData` uses, so it guards the envelope key derivation.
    expect(crypto.to_hex(crypto.computeSymmetricKey(crypto.from_hex(KEY), new Uint8Array()))).toBe(
      "46bd320605c5a6b6163ab70bc6345b92a5f908e79fe58979c23ebb47d1a5e307",
    );
  });

  it("derives the same ECDH shared secret", () => {
    const shared = crypto.ecdh(
      crypto.keypairFromSecretKey(crypto.from_hex(PRIVATE_KEY)),
      crypto.keypairFromSecretKey(crypto.from_hex(KEY)).publicKey,
    );
    expect(crypto.to_hex(shared)).toBe(
      "555f5834f63e5d5d87af5d723005300bb33eba38792ea274f2202f0468032e31",
    );
  });

  it("decrypts a user data envelope produced by the original implementation", () => {
    // Guards against orphaning already-synchronised Ledger Sync data.
    const envelope = crypto.from_hex(
      "0002844a51c636896f02189709cd8b53ea8b4be928bf482415660e8e32bf473bf3cef591810cab42c392e304588bd5196a3773d3cae480d3bf9c79f79b1831bea6ba14ccdbba794a18843c28b9bb2ed722d5dbb1c4f4be9e291a",
    );
    const decrypted = crypto.decryptUserData(crypto.from_hex(PRIVATE_KEY), envelope);
    expect(crypto.to_hex(decrypted)).toBe(MESSAGE);
  });
});
