import coinConfigOverridesReducer, {
  sanitizePersistedOverrides,
  setAllCoinConfigOverrides,
  setCoinConfigOverride,
} from "../coinConfigOverrides";

describe("sanitizePersistedOverrides", () => {
  it.each([
    ["undefined", undefined],
    ["null", null],
    ["a string", "config_currency_solana"],
    ["a number", 42],
    ["a boolean", true],
    ["an array", [{ config_currency_solana: { showNfts: false } }]],
  ])("returns null when the persisted payload is %s", (_label, input) => {
    expect(sanitizePersistedOverrides(input)).toBeNull();
  });

  it("returns a fresh map of own enumerable entries when the payload is a plain object", () => {
    const raw = {
      config_currency_solana: { token2022Enabled: true },
      config_currency_ethereum: { showNfts: false },
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
    ["a class instance", new (class Foo {})()],
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

describe("coinConfigOverrides reducer", () => {
  const pollutedKey = "polluted_key";

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (Object.prototype as any)[pollutedKey];
  });

  it.each(["__proto__", "constructor", "prototype"])(
    "setCoinConfigOverride is a no-op for the unsafe key %s",
    unsafeKey => {
      const next = coinConfigOverridesReducer(
        { overrides: {} },
        setCoinConfigOverride({ key: unsafeKey, value: { polluted: pollutedKey } }),
      );
      expect(next.overrides).toEqual({});
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((({} as any)[unsafeKey] as any)?.polluted).not.toBe(pollutedKey);
    },
  );

  it("setAllCoinConfigOverrides strips unsafe keys and undefined values from the payload", () => {
    const next = coinConfigOverridesReducer(
      { overrides: { config_currency_keep: { ok: true } } },
      setAllCoinConfigOverrides(
        JSON.parse(
          `{"__proto__": {"${pollutedKey}": true}, "constructor": "evil", "config_currency_solana": {"token2022Enabled": true}}`,
        ),
      ),
    );
    expect(next.overrides).toEqual({
      config_currency_solana: { token2022Enabled: true },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(({} as any)[pollutedKey]).toBeUndefined();
  });

  it("setCoinConfigOverride deletes an existing override when value is undefined", () => {
    const next = coinConfigOverridesReducer(
      { overrides: { config_currency_solana: { token2022Enabled: true } } },
      setCoinConfigOverride({ key: "config_currency_solana", value: undefined }),
    );
    expect(next.overrides).toEqual({});
  });
});
