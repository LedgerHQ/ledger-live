import { createPasswordVerifier, type ScryptParams } from "@shared/password-verifier";
import { deserialisePasswordVerifier, serialisePasswordVerifier } from "./verifierStore";

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

describe("password verifier codec", () => {
  it("round-trips a verifier through storage", () => {
    const restored = deserialisePasswordVerifier(serialisePasswordVerifier(verifier));

    expect(restored).toEqual(verifier);
    expect(restored?.salt).toBeInstanceOf(Uint8Array);
    expect(restored?.digest).toBeInstanceOf(Uint8Array);
  });

  it("keeps the scrypt parameters, so an older verifier stays checkable", () => {
    const restored = deserialisePasswordVerifier(serialisePasswordVerifier(verifier));

    expect(restored?.scrypt).toEqual(scrypt);
  });

  it("round-trips bytes that are not valid UTF-8", () => {
    const binary = createPasswordVerifier({
      digest: Uint8Array.from([0, 255, 128, 254]),
      salt: Uint8Array.from([255, 0, 1, 128]),
      scrypt,
    });

    expect(deserialisePasswordVerifier(serialisePasswordVerifier(binary))).toEqual(binary);
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
    expect(deserialisePasswordVerifier(raw)).toBeNull();
  });
});
