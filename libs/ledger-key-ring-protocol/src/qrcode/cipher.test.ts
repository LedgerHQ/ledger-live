import { crypto } from "@ledgerhq/hw-ledger-key-ring-protocol";
import { makeCipher } from "./cipher";
import { InvalidEncryptionKeyError } from "../errors";

describe("makeCipher", () => {
  it("should encrypt and decrypt correctly", () => {
    const ephemeralKey = crypto.randomKeypair();
    const candidate = crypto.randomKeypair();
    const sessionEncryptionKey = crypto.ecdh(ephemeralKey, candidate.publicKey);
    const cipher = makeCipher(sessionEncryptionKey);
    const plaintext = { message: "Hello, World!" };
    const encrypted = cipher.encrypt(plaintext);
    expect(typeof encrypted).toBe("string");
    const decrypted = cipher.decrypt(encrypted);
    expect(decrypted).toEqual(plaintext);
  });

  it("should throw InvalidEncryptionKeyError if key changes", () => {
    const ephemeralKey = crypto.randomKeypair();
    const candidate = crypto.randomKeypair();
    const sessionEncryptionKey = crypto.ecdh(ephemeralKey, candidate.publicKey);
    const cipher = makeCipher(sessionEncryptionKey);
    const plaintext = { message: "Hello, World!" };
    const encrypted = cipher.encrypt(plaintext);
    const ephemeralKey2 = crypto.randomKeypair();
    const otherSessionEncryptionKey = crypto.ecdh(ephemeralKey2, candidate.publicKey);
    const cipher2 = makeCipher(otherSessionEncryptionKey);
    expect(() => cipher2.decrypt(encrypted)).toThrow(InvalidEncryptionKeyError);
  });
});
