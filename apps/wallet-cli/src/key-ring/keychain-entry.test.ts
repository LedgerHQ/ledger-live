import { afterEach, describe, it, expect } from "bun:test";
import { deriveDomainKey } from "./crypto";
import {
  wrapSecret,
  unwrapSecret,
  assertOsKeychainAvailable,
  _setTestKeychainProbe,
} from "./keychain-entry";
import { KeychainUnavailableError } from "./keychain-unavailable-error";
import { failingKeychainProbe, overridePlatform } from "../testing/os-keychain";

const KEY_HEX = "cafe".repeat(16);

class PasswordRequiredSentinel extends Error {}
class CorruptSentinel extends Error {}

function onPasswordRequired(): never {
  throw new PasswordRequiredSentinel("password required");
}
function onCorrupt(): never {
  throw new CorruptSentinel("corrupt");
}

describe("wrapSecret / unwrapSecret", () => {
  it("returns the secret verbatim with no wrappingKey", async () => {
    expect(await wrapSecret("deadbeef")).toBe("deadbeef");
  });

  it("round-trips through encryption when a wrappingKey is given", async () => {
    const key = await deriveDomainKey(KEY_HEX, "d");
    const wrapped = await wrapSecret("deadbeef", key);
    expect(wrapped.startsWith("ENC:")).toBe(true);
    expect(await unwrapSecret(wrapped, key, onPasswordRequired, onCorrupt)).toBe("deadbeef");
  });

  it("passes an unwrapped (non-ENC-prefixed) value straight through, ignoring wrappingKey", async () => {
    const key = await deriveDomainKey(KEY_HEX, "d");
    expect(await unwrapSecret("deadbeef", key, onPasswordRequired, onCorrupt)).toBe("deadbeef");
    expect(await unwrapSecret("deadbeef", undefined, onPasswordRequired, onCorrupt)).toBe(
      "deadbeef",
    );
  });

  it("calls onPasswordRequired for an ENC-prefixed value with no wrappingKey", async () => {
    const key = await deriveDomainKey(KEY_HEX, "d");
    const wrapped = await wrapSecret("deadbeef", key);
    await expect(unwrapSecret(wrapped, undefined, onPasswordRequired, onCorrupt)).rejects.toThrow(
      PasswordRequiredSentinel,
    );
  });

  it("calls onCorrupt for a non-hex ENC payload", async () => {
    const key = await deriveDomainKey(KEY_HEX, "d");
    await expect(unwrapSecret("ENC:not-hex", key, onPasswordRequired, onCorrupt)).rejects.toThrow(
      CorruptSentinel,
    );
  });

  it("throws a generic wrong-password error when decryption fails with the wrong key", async () => {
    const key = await deriveDomainKey(KEY_HEX, "d");
    const otherKey = await deriveDomainKey(KEY_HEX, "other");
    const wrapped = await wrapSecret("deadbeef", key);
    await expect(unwrapSecret(wrapped, otherKey, onPasswordRequired, onCorrupt)).rejects.toThrow(
      "Wrong password",
    );
  });
});

describe("assertOsKeychainAvailable", () => {
  let probes = 0;
  const failingProbe = () => {
    probes++;
    failingKeychainProbe();
  };
  let restorePlatform: () => void;

  afterEach(() => {
    restorePlatform();
    _setTestKeychainProbe(null);
    probes = 0;
  });

  it("throws KeychainUnavailableError with the hint on Linux when the Secret Service probe fails", () => {
    restorePlatform = overridePlatform("linux");
    _setTestKeychainProbe(failingProbe);

    expect(() => assertOsKeychainAvailable("Hint.")).toThrow(KeychainUnavailableError);
    expect(() => assertOsKeychainAvailable("Hint.")).toThrow(
      /no Secret Service provider.*\(Platform failure: DBus error: .*org\.freedesktop\.secrets.*\)\. Hint\./,
    );
    expect(probes).toBe(2);
  });

  it("passes on Linux when the probe returns", () => {
    restorePlatform = overridePlatform("linux");
    _setTestKeychainProbe(() => null);

    expect(() => assertOsKeychainAvailable("Hint.")).not.toThrow();
  });

  it.each(["darwin", "win32"] as const)("never probes on %s", platform => {
    restorePlatform = overridePlatform(platform);
    _setTestKeychainProbe(failingProbe);

    expect(() => assertOsKeychainAvailable("Hint.")).not.toThrow();
    expect(probes).toBe(0);
  });
});
