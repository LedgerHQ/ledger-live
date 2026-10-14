import { describe, it, expect } from "bun:test";
import { deriveDomainKey } from "./crypto";
import { wrapSecret, unwrapSecret } from "./keychain-entry";

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
