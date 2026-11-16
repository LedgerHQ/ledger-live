import {
  liveConfigOverridesReducer,
  setAllLiveConfigOverrides,
  setLiveConfigOverride,
} from "./slice";

describe("liveConfigOverrides reducer", () => {
  const pollutedKey = "polluted_key";

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (Object.prototype as any)[pollutedKey];
  });

  it.each(["__proto__", "constructor", "prototype"])(
    "setLiveConfigOverride is a no-op for the unsafe key %s",
    unsafeKey => {
      const next = liveConfigOverridesReducer(
        { overrides: {} },
        setLiveConfigOverride({ key: unsafeKey, value: { polluted: pollutedKey } }),
      );
      expect(next.overrides).toEqual({});
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((({} as any)[unsafeKey] as any)?.polluted).not.toBe(pollutedKey);
    },
  );

  it("setAllLiveConfigOverrides strips unsafe keys and undefined values from the payload", () => {
    const next = liveConfigOverridesReducer(
      { overrides: { config_currency_keep: { ok: true } } },
      setAllLiveConfigOverrides(
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

  it("setLiveConfigOverride deletes an existing override when value is undefined", () => {
    const next = liveConfigOverridesReducer(
      { overrides: { config_currency_solana: { token2022Enabled: true } } },
      setLiveConfigOverride({ key: "config_currency_solana", value: undefined }),
    );
    expect(next.overrides).toEqual({});
  });
});

describe("setLiveConfigOverride", () => {
  it("adds an override without touching the others", () => {
    const next = liveConfigOverridesReducer(
      { overrides: { config_currency_keep: { ok: true } } },
      setLiveConfigOverride({ key: "config_currency_solana", value: { token2022Enabled: true } }),
    );
    expect(next.overrides).toEqual({
      config_currency_keep: { ok: true },
      config_currency_solana: { token2022Enabled: true },
    });
  });
});
