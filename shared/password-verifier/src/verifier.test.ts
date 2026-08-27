import type { ScryptParams } from "./types";
import {
  PASSWORD_VERIFIER_VERSION,
  createPasswordVerifier,
  matchesPasswordVerifier,
} from "./verifier";

const scrypt: ScryptParams = {
  cost: 16384,
  blockSize: 8,
  parallelization: 1,
  digestLength: 4,
};

const digest = Uint8Array.from([10, 20, 30, 40]);
const salt = Uint8Array.from([1, 2, 3, 4]);

describe("createPasswordVerifier", () => {
  it("stamps the current version and keeps the scrypt parameters", () => {
    const verifier = createPasswordVerifier({ digest, salt, scrypt });

    expect(verifier.version).toBe(PASSWORD_VERIFIER_VERSION);
    expect(verifier.scrypt).toEqual(scrypt);
    expect(verifier.digest).toEqual(digest);
    expect(verifier.salt).toEqual(salt);
  });

  it("copies the bytes so mutating the caller's arrays cannot alter the verifier", () => {
    const mutableDigest = Uint8Array.from(digest);
    const mutableSalt = Uint8Array.from(salt);
    const verifier = createPasswordVerifier({
      digest: mutableDigest,
      salt: mutableSalt,
      scrypt,
    });

    mutableDigest[0] = 99;
    mutableSalt[0] = 99;

    expect(verifier.digest).toEqual(digest);
    expect(verifier.salt).toEqual(salt);
  });
});

describe("matchesPasswordVerifier", () => {
  const verifier = createPasswordVerifier({ digest, salt, scrypt });

  it("accepts the identical digest", () => {
    expect(matchesPasswordVerifier(verifier, Uint8Array.from(digest))).toBe(true);
  });

  it("rejects a digest differing in the last byte", () => {
    expect(matchesPasswordVerifier(verifier, Uint8Array.from([10, 20, 30, 41]))).toBe(false);
  });

  it("rejects a digest differing in the first byte", () => {
    expect(matchesPasswordVerifier(verifier, Uint8Array.from([11, 20, 30, 40]))).toBe(false);
  });

  it("rejects a digest differing in a single bit", () => {
    expect(matchesPasswordVerifier(verifier, Uint8Array.from([10, 20, 30, 41]))).toBe(false);
    expect(matchesPasswordVerifier(verifier, Uint8Array.from([10, 20, 30, 42]))).toBe(false);
  });

  it("rejects a shorter and a longer digest", () => {
    expect(matchesPasswordVerifier(verifier, Uint8Array.from([10, 20, 30]))).toBe(false);
    expect(matchesPasswordVerifier(verifier, Uint8Array.from([10, 20, 30, 40, 50]))).toBe(false);
  });

  it("rejects an empty digest", () => {
    expect(matchesPasswordVerifier(verifier, new Uint8Array())).toBe(false);
  });

  it("does not accept a prefix of the stored digest", () => {
    const truncated = createPasswordVerifier({
      digest: Uint8Array.from([10, 20]),
      salt,
      scrypt: { ...scrypt, digestLength: 2 },
    });

    expect(matchesPasswordVerifier(truncated, Uint8Array.from(digest))).toBe(false);
  });

  it("compares content, not identity", () => {
    const equalByValue = Uint8Array.from([10, 20, 30, 40]);

    expect(equalByValue === verifier.digest).toBe(false);
    expect(matchesPasswordVerifier(verifier, equalByValue)).toBe(true);
  });
});
