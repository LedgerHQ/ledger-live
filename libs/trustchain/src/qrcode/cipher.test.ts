import { crypto } from "@ledgerhq/hw-trustchain";
import { makeCipher } from "./cipher";
import { InvalidEncryptionKeyError } from "../errors";

describe("makeCipher", () => {
  it("should encrypt and decrypt correctly", async () => {
    const ephemeralKey = await crypto.randomKeypair();
    const candidate = await crypto.randomKeypair();
    const sessionEncryptionKey = await crypto.ecdh(ephemeralKey, candidate.publicKey);
    const cipher = makeCipher(sessionEncryptionKey);
    const plaintext = { message: "Hello, World!" };
    const encrypted = await cipher.encrypt(plaintext);
    expect(typeof encrypted).toBe("string");
    const decrypted = await cipher.decrypt(encrypted);
    expect(decrypted).toEqual(plaintext);
  });

  it("should throw InvalidEncryptionKeyError if key changes", async () => {
    const ephemeralKey = await crypto.randomKeypair();
    const candidate = await crypto.randomKeypair();
    const sessionEncryptionKey = await crypto.ecdh(ephemeralKey, candidate.publicKey);
    const cipher = makeCipher(sessionEncryptionKey);
    const plaintext = { message: "Hello, World!" };
    const encrypted = await cipher.encrypt(plaintext);
    const ephemeralKey2 = await crypto.randomKeypair();
    const otherSessionEncryptionKey = await crypto.ecdh(ephemeralKey2, candidate.publicKey);
    const cipher2 = makeCipher(otherSessionEncryptionKey);
    expect(cipher2.decrypt(encrypted)).rejects.toThrow(InvalidEncryptionKeyError);
  });
});
