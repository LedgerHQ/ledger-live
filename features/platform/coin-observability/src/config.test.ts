import {
  coinObservabilityConfigFor,
  DEFAULT_MAX_FAILURES_PER_KEY,
  DEFAULT_SYNC_PATH_SAMPLE_RATE,
  readCoinObservabilityConfig,
  setCoinObservabilityConfigReader,
  toCoinObservabilityConfig,
} from "./config";

describe("toCoinObservabilityConfig", () => {
  it("is null when the flag is absent or off", () => {
    expect(toCoinObservabilityConfig(undefined)).toBeNull();
    expect(toCoinObservabilityConfig(null)).toBeNull();
    expect(
      toCoinObservabilityConfig({
        enabled: false,
        params: { syncPathSampleRate: 1, maxFailuresPerKey: 1 },
      }),
    ).toBeNull();
  });

  it("uses the flag params when present", () => {
    expect(
      toCoinObservabilityConfig({
        enabled: true,
        params: { syncPathSampleRate: 0.3, maxFailuresPerKey: 7 },
      }),
    ).toEqual({ includeSyncPath: true, syncPathSampleRate: 0.3, maxFailuresPerKey: 7 });
  });

  it("falls back to each default when the flag is on without params", () => {
    expect(toCoinObservabilityConfig({ enabled: true })).toEqual({
      includeSyncPath: true,
      syncPathSampleRate: DEFAULT_SYNC_PATH_SAMPLE_RATE,
      maxFailuresPerKey: DEFAULT_MAX_FAILURES_PER_KEY,
    });
    expect(toCoinObservabilityConfig({ enabled: true, params: { maxFailuresPerKey: 0 } })).toEqual({
      includeSyncPath: true,
      syncPathSampleRate: DEFAULT_SYNC_PATH_SAMPLE_RATE,
      maxFailuresPerKey: 0,
    });
    expect(
      toCoinObservabilityConfig({ enabled: true, params: { includeSyncPath: false } }),
    ).toMatchObject({ includeSyncPath: false });
  });
});

describe("coin observability config reader", () => {
  afterEach(() => setCoinObservabilityConfigReader(null));

  it("reads null until a host injects a reader", () => {
    expect(readCoinObservabilityConfig()).toBeNull();
  });

  it("returns what the injected reader returns, and null again once cleared", () => {
    const config = { includeSyncPath: true, syncPathSampleRate: 0.2, maxFailuresPerKey: 3 };
    setCoinObservabilityConfigReader(() => config);
    expect(readCoinObservabilityConfig()).toBe(config);
    setCoinObservabilityConfigReader(null);
    expect(readCoinObservabilityConfig()).toBeNull();
  });
});

const flagOn = { enabled: true, params: { syncPathSampleRate: 0.2, maxFailuresPerKey: 3 } };

describe("coinObservabilityConfigFor", () => {
  it("returns the flag's config when consent, Datadog and the flag are all on", () => {
    expect(
      coinObservabilityConfigFor({
        consentGranted: true,
        datadogEnabled: true,
        coinObservability: flagOn,
      }),
    ).toEqual({ includeSyncPath: true, syncPathSampleRate: 0.2, maxFailuresPerKey: 3 });
  });

  it("sends nothing when the user declined crash or bug reporting", () => {
    expect(
      coinObservabilityConfigFor({
        consentGranted: false,
        datadogEnabled: true,
        coinObservability: flagOn,
      }),
    ).toBeNull();
  });

  it("sends nothing when the Datadog flag is off, even after initialisation", () => {
    expect(
      coinObservabilityConfigFor({
        consentGranted: true,
        datadogEnabled: false,
        coinObservability: flagOn,
      }),
    ).toBeNull();
  });

  it("sends nothing when the coinObservability flag is off or missing", () => {
    expect(
      coinObservabilityConfigFor({
        consentGranted: true,
        datadogEnabled: true,
        coinObservability: { enabled: false },
      }),
    ).toBeNull();
    expect(
      coinObservabilityConfigFor({
        consentGranted: true,
        datadogEnabled: true,
        coinObservability: undefined,
      }),
    ).toBeNull();
  });
});
