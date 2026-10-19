import { afterEach, describe, it, expect } from "bun:test";
import { deriveDomainKey } from "./crypto";
import {
  wrapSecret,
  unwrapSecret,
  assertOsKeychainAvailable,
  KeychainUnavailableError,
  _setTestKeychainProbe,
} from "./keychain-entry";

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
  const realPlatform = Object.getOwnPropertyDescriptor(process, "platform")!;
  const probedServices: string[] = [];
  const failingProbe = (service: string) => {
    probedServices.push(service);
    throw new Error("no secret service provider or dbus session found");
  };

  afterEach(() => {
    Object.defineProperty(process, "platform", realPlatform);
    _setTestKeychainProbe(null);
    probedServices.length = 0;
  });

  it("throws KeychainUnavailableError with the hint on Linux when the Secret Service probe fails", () => {
    Object.defineProperty(process, "platform", { value: "linux" });
    _setTestKeychainProbe(failingProbe);

    expect(() => assertOsKeychainAvailable("Hint.")).toThrow(KeychainUnavailableError);
    expect(() => assertOsKeychainAvailable("Hint.")).toThrow(
      /no Secret Service provider.*\(no secret service provider or dbus session found\)\. Hint\./,
    );
    expect(probedServices[0]).toBe("ledger-wallet-cli-probe");
  });

  it("passes on Linux when the probe returns", () => {
    Object.defineProperty(process, "platform", { value: "linux" });
    _setTestKeychainProbe(() => []);

    expect(() => assertOsKeychainAvailable("Hint.")).not.toThrow();
  });

  it.each(["darwin", "win32"])("never probes on %s", platform => {
    Object.defineProperty(process, "platform", { value: platform });
    _setTestKeychainProbe(failingProbe);

    expect(() => assertOsKeychainAvailable("Hint.")).not.toThrow();
    expect(probedServices).toEqual([]);
  });
});
