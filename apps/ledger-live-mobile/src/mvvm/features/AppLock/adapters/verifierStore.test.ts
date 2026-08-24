import { createPasswordVerifier, type ScryptParams } from "@shared/password-verifier";
import { deserialiseStoredPassword, serialiseStoredPassword } from "./verifierStore";

const scrypt: ScryptParams = {
  cost: 16384,
  blockSize: 8,
  parallelization: 1,
  digestLength: 4,
};

const verifier = createPasswordVerifier({
  digest: Uint8Array.from([10, 20, 30, 40]),
  salt: Uint8Array.from([1, 2, 3, 4]),
  scrypt,
});

const stored = { verifier, needsLongerPassword: false } as const;

describe("password verifier codec", () => {
  it("round-trips a verifier through storage", () => {
    const restored = deserialiseStoredPassword(serialiseStoredPassword(stored));

    expect(restored).toEqual(stored);
    expect(restored?.verifier.salt).toBeInstanceOf(Uint8Array);
    expect(restored?.verifier.digest).toBeInstanceOf(Uint8Array);
  });

  it("keeps the scrypt parameters, so an older verifier stays checkable", () => {
    const restored = deserialiseStoredPassword(serialiseStoredPassword(stored));

    expect(restored?.verifier.scrypt).toEqual(scrypt);
  });

  it("round-trips bytes that are not valid UTF-8", () => {
    const binary = createPasswordVerifier({
      digest: Uint8Array.from([0, 255, 128, 254]),
      salt: Uint8Array.from([255, 0, 1, 128]),
      scrypt,
    });
    const record = { verifier: binary, needsLongerPassword: false } as const;

    expect(deserialiseStoredPassword(serialiseStoredPassword(record))).toEqual(record);
  });

  it("carries an under-minimum password across a restart", () => {
    const record = { verifier, needsLongerPassword: true } as const;

    expect(deserialiseStoredPassword(serialiseStoredPassword(record))?.needsLongerPassword).toBe(
      true,
    );
  });

  it("reads a record written before the mark existed as not owing a longer password", () => {
    const legacy = `{"version":1,"scrypt":${JSON.stringify(scrypt)},"salt":"AAAA","digest":"AAAA"}`;

    expect(deserialiseStoredPassword(legacy)?.needsLongerPassword).toBe(false);
  });

  const params = JSON.stringify(scrypt);

  it.each([
    ["not json", "}{"],
    ["a json primitive", '"nope"'],
    ["null", "null"],
    ["a missing digest", `{"version":1,"scrypt":${params},"salt":"AAAA"}`],
    ["a non-numeric version", `{"version":"1","scrypt":${params},"salt":"AA","digest":"AA"}`],
    ["a missing scrypt block", '{"version":1,"salt":"AA","digest":"AA"}'],
    ["an empty scrypt block", '{"version":1,"scrypt":{},"salt":"AA","digest":"AA"}'],
    [
      "a partial scrypt block",
      '{"version":1,"scrypt":{"cost":16384,"blockSize":8},"salt":"AA","digest":"AA"}',
    ],
    [
      "non-numeric scrypt parameters",
      '{"version":1,"scrypt":{"cost":"16384","blockSize":8,"parallelization":1,"digestLength":32},"salt":"AA","digest":"AA"}',
    ],
    [
      "a zero digest length",
      '{"version":1,"scrypt":{"cost":16384,"blockSize":8,"parallelization":1,"digestLength":0},"salt":"AA","digest":"AA"}',
    ],
  ])("treats %s as unreadable rather than throwing", (_case, raw) => {
    expect(deserialiseStoredPassword(raw)).toBeNull();
  });
});
