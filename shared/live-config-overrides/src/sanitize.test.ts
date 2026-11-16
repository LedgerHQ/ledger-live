import { sanitizePersistedOverrides } from "./sanitize";

describe("sanitizePersistedOverrides", () => {
  it.each([
    ["undefined", undefined],
    ["null", null],
    ["a string", "config_currency_solana"],
    ["a number", 42],
    ["a boolean", true],
    ["an array", [{ config_currency_solana: { supportedTokens: [] } }]],
  ])("returns null when the persisted payload is %s", (_label, input) => {
    expect(sanitizePersistedOverrides(input)).toBeNull();
  });

  it("returns a fresh map of own enumerable entries when the payload is a plain object", () => {
    const raw = {
      config_currency_solana: { token2022Enabled: true },
      config_currency_ethereum: { supportedTokens: [] },
    };

    const sanitized = sanitizePersistedOverrides(raw);

    expect(sanitized).toEqual(raw);
    // Defensive copy — mutating the input afterwards must not bleed into LiveConfig later.
    expect(sanitized).not.toBe(raw);
  });

  it("returns an empty map when the payload is an empty object", () => {
    expect(sanitizePersistedOverrides({})).toEqual({});
  });

  it.each([
    ["a Date", new Date(0)],
    ["a Map", new Map([["k", "v"]])],
    [
      "a class instance",
      new (class Foo {
        readonly config_currency_solana = {};
      })(),
    ],
    [
      "an object with a custom prototype",
      (() => {
        const parent = { leaked: "should not appear" };
        const child = Object.create(parent);
        child.config_currency_solana = { token2022Enabled: true };
        return child;
      })(),
    ],
  ])("rejects %s as not a plain object", (_label, input) => {
    expect(sanitizePersistedOverrides(input)).toBeNull();
  });

  it("accepts Object.create(null) as a plain object", () => {
    const raw: Record<string, unknown> = Object.create(null);
    raw.config_currency_solana = { token2022Enabled: true };
    expect(sanitizePersistedOverrides(raw)).toEqual({
      config_currency_solana: { token2022Enabled: true },
    });
  });

  describe("prototype-pollution defense", () => {
    const pollutedKey = "polluted_key";

    afterEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (Object.prototype as any)[pollutedKey];
    });

    it("drops __proto__ / constructor / prototype keys parsed from JSON", () => {
      // JSON.parse turns the literal `"__proto__"` key into an own property,
      // so it bypasses the normal `__proto__` setter and is exactly what a
      // malicious app.json payload looks like on disk.
      const raw = JSON.parse(
        `{"__proto__": {"${pollutedKey}": true}, "constructor": "evil", "prototype": "evil", "config_currency_solana": {"token2022Enabled": true}}`,
      );

      const sanitized = sanitizePersistedOverrides(raw);

      expect(sanitized).toEqual({ config_currency_solana: { token2022Enabled: true } });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(({} as any)[pollutedKey]).toBeUndefined();
    });

    it("drops keys whose value is undefined", () => {
      const sanitized = sanitizePersistedOverrides({
        config_currency_solana: { token2022Enabled: true },
        config_currency_dropped: undefined,
      });
      expect(sanitized).toEqual({ config_currency_solana: { token2022Enabled: true } });
    });
  });
});
