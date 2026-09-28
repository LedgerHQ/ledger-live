import { createPasswordVerifier, type ScryptParams } from "@shared/password-verifier";
import {
  deserialisePasswordVerifier,
  hasStoredVerifier,
  serialisePasswordVerifier,
  writePasswordVerifier,
} from "./store.native";

const keychain = jest.requireMock("react-native-keychain");

jest.mock("react-native-keychain", () => ({
  ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: "AccessibleWhenUnlockedThisDeviceOnly" },
  setGenericPassword: jest.fn(async () => true),
  getGenericPassword: jest.fn(async () => false),
  resetGenericPassword: jest.fn(async () => true),
}));

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
    const restored = deserialisePasswordVerifier(serialisePasswordVerifier(stored));

    expect(restored).toEqual(stored);
    expect(restored?.verifier.salt).toBeInstanceOf(Uint8Array);
    expect(restored?.verifier.digest).toBeInstanceOf(Uint8Array);
  });

  it("round-trips the mark, which nothing can recompute from the digest", () => {
    const short = { verifier, needsLongerPassword: true } as const;

    expect(deserialisePasswordVerifier(serialisePasswordVerifier(short))).toEqual(short);
  });

  it("reads a record without the mark as compliant", () => {
    const raw = `{"version":1,"scrypt":${JSON.stringify(scrypt)},"salt":"AQIDBA==","digest":"ChQeKA=="}`;

    expect(deserialisePasswordVerifier(raw)?.needsLongerPassword).toBe(false);
  });

  it("keeps the scrypt parameters, so an older verifier stays checkable", () => {
    const restored = deserialisePasswordVerifier(serialisePasswordVerifier(stored));

    expect(restored?.verifier.scrypt).toEqual(scrypt);
  });

  it("round-trips bytes that are not valid UTF-8", () => {
    const binary = {
      verifier: createPasswordVerifier({
        digest: Uint8Array.from([0, 255, 128, 254]),
        salt: Uint8Array.from([255, 0, 1, 128]),
        scrypt,
      }),
      needsLongerPassword: false,
    } as const;

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
    [
      "a fractional version",
      `{"version":1.5,"scrypt":${params},"salt":"AQIDBA==","digest":"ChQeKA=="}`,
    ],
    [
      "a digest that cannot match the recorded length",
      `{"version":1,"scrypt":${params},"salt":"AQIDBA==","digest":"AA"}`,
    ],
  ])("treats %s as unreadable rather than throwing", (_case, raw) => {
    expect(deserialisePasswordVerifier(raw)).toBeNull();
  });
});

describe("hasStoredVerifier", () => {
  it("is false when the keychain holds no record", async () => {
    keychain.getGenericPassword.mockResolvedValue(false);

    await expect(hasStoredVerifier()).resolves.toBe(false);
  });

  it("is true for a stored verifier", async () => {
    keychain.getGenericPassword.mockResolvedValue({
      service: "app-lock",
      username: "app-lock",
      password: serialisePasswordVerifier(stored),
    });

    await expect(hasStoredVerifier()).resolves.toBe(true);
  });

  // Existence, not readability: reading an unparsable record as "no protection" would let the user
  // straight in, so this predicate must not deserialise.
  it("is true for a record it cannot parse", async () => {
    keychain.getGenericPassword.mockResolvedValue({
      service: "app-lock",
      username: "app-lock",
      password: "}{",
    });

    await expect(hasStoredVerifier()).resolves.toBe(true);
  });

  it("rejects when the keychain cannot be read, so hydration fails closed", async () => {
    keychain.getGenericPassword.mockRejectedValue(new Error("keychain unavailable"));

    await expect(hasStoredVerifier()).rejects.toThrow("keychain unavailable");
  });
});

describe("writing the record", () => {
  it("stores the serialised verifier under the app lock service", async () => {
    keychain.setGenericPassword.mockResolvedValue({ service: "app-lock" });

    await writePasswordVerifier(stored);

    expect(keychain.setGenericPassword).toHaveBeenCalledWith(
      "app-lock",
      serialisePasswordVerifier(stored),
      expect.objectContaining({ service: "com.ledger.live.appLock.passwordVerifier" }),
    );
  });

  it("refuses to report a write the keychain declined", async () => {
    keychain.setGenericPassword.mockResolvedValue(false);

    await expect(writePasswordVerifier(stored)).rejects.toThrow("refused");
  });
});
