// `@react-native-firebase/remote-config` keeps its last *activated* config on disk. That config
// is the app's only memory of the previous session's flags: the Redux slice persists local
// overrides only, and the middleware's remote map is closure-private and rebuilt from `{}` on
// every boot.
//
// `readCachedFlags` serves it without touching the network, so boot resolves on last-known-good
// instead of compiled defaults.
jest.unmock("~/firebase/remoteConfig");

// Declared as a module so its locals do not collide with the sibling `remoteConfig.test.ts`,
// which has no top-level import/export and therefore lives in the global scope.
export {};

const mockSetSettings = jest.fn();
const mockSetDefaultConfig = jest.fn();
const mockActivate = jest.fn();
const mockFetchAndActivate = jest.fn();
const mockEnsureInitialized = jest.fn();
const mockGetAll = jest.fn();
const mockRemoteConfig = {
  get settings() {
    return { fetchTimeoutMillis: 60000, minimumFetchIntervalMillis: 43200000 };
  },
  set settings(settings: unknown) {
    mockSetSettings(settings);
  },
  set defaultConfig(defaults: unknown) {
    mockSetDefaultConfig(defaults);
  },
};

jest.mock("@react-native-firebase/remote-config", () => ({
  getRemoteConfig: () => mockRemoteConfig,
  activate: () => mockActivate(),
  fetchAndActivate: () => mockFetchAndActivate(),
  ensureInitialized: () => mockEnsureInitialized(),
  getAll: () => mockGetAll(),
  getValue: jest.fn(),
}));
jest.mock("@features/platform-feature-flags-firebase", () => ({
  ...jest.requireActual("@features/platform-feature-flags-firebase"),
  formatDefaultFeatures: () => ({ feature_mock_feature: JSON.stringify({ enabled: false }) }),
}));

const value = (raw: string, source: "remote" | "default" | "static" = "remote") => ({
  asString: () => raw,
  getSource: () => source,
});

async function loadModule() {
  return await import("./remoteConfig");
}

beforeEach(() => {
  jest.resetModules();
  mockSetSettings.mockReset();
  mockSetDefaultConfig.mockReset();
  mockActivate.mockReset().mockResolvedValue(false);
  mockFetchAndActivate.mockReset().mockResolvedValue(true);
  mockEnsureInitialized.mockReset().mockResolvedValue(undefined);
  mockGetAll.mockReset().mockReturnValue({});
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("readCachedFlags", () => {
  it("serves the last activated config without touching the network", async () => {
    mockGetAll.mockReturnValue({
      feature_llm_wallet_sync: value(
        JSON.stringify({
          enabled: true,
          params: { environment: "PROD", watchConfig: {}, learnMoreLink: "" },
        }),
      ),
      feature_copy_upgrade_banner: value(
        JSON.stringify({ enabled: true, copy: { "upgrade.banner.title": "Cached title" } }),
      ),
    });

    const { readCachedFlags } = await loadModule();

    await expect(readCachedFlags()).resolves.toEqual({
      llmWalletSync: {
        enabled: true,
        params: { environment: "PROD", watchConfig: {}, learnMoreLink: "" },
      },
    });
    expect(mockFetchAndActivate).not.toHaveBeenCalled();
    const { getContentAbTestCopy } = await import("@features/platform-content-ab-tests");
    expect(getContentAbTestCopy()).toEqual({ "upgrade.banner.title": "Cached title" });
    expect(mockGetAll).toHaveBeenCalledTimes(1);
  });

  it("does not call ensureInitialized, which fetches over the network on Android", async () => {
    // RNFB's Android `ensureInitialized` runs a blocking `fetchAndActivate` internally, so using
    // it as a barrier would put this read back on the network. `activate` is the right barrier:
    // it waits for the queued setters, then hydrates the value map from disk.
    const { readCachedFlags } = await loadModule();

    await readCachedFlags();

    expect(mockEnsureInitialized).not.toHaveBeenCalled();
    expect(mockSetSettings).toHaveBeenCalled();
    expect(mockSetDefaultConfig).toHaveBeenCalled();
    expect(mockActivate).toHaveBeenCalledTimes(1);
  });

  it("reads the value map only after the activate barrier resolves", async () => {
    let releaseActivate: (changed: boolean) => void = () => {};
    mockActivate.mockReturnValue(
      new Promise<boolean>(resolve => {
        releaseActivate = resolve;
      }),
    );

    const { readCachedFlags } = await loadModule();
    const pending = readCachedFlags();
    await Promise.resolve();
    expect(mockGetAll).not.toHaveBeenCalled();

    releaseActivate(false);
    await pending;
    expect(mockGetAll).toHaveBeenCalledTimes(1);
  });

  it("excludes entries served from the compiled defaults", async () => {
    mockGetAll.mockReturnValue({
      feature_counter_value: value(JSON.stringify({ enabled: true }), "remote"),
      feature_llm_wallet_sync: value(JSON.stringify({ enabled: false }), "default"),
      feature_lwm_wallet_40: value(JSON.stringify({ enabled: false }), "static"),
    });

    const { readCachedFlags } = await loadModule();

    await expect(readCachedFlags()).resolves.toEqual({ counterValue: { enabled: true } });
  });

  it("still serves the config hydrated from disk when activate fails", async () => {
    mockActivate.mockRejectedValue(new Error("Internal error activating config"));
    mockGetAll.mockReturnValue({
      feature_counter_value: value(JSON.stringify({ enabled: true })),
    });

    const { readCachedFlags } = await loadModule();

    await expect(readCachedFlags()).resolves.toEqual({ counterValue: { enabled: true } });
    expect(mockFetchAndActivate).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it("resolves empty when the native module cannot be reached", async () => {
    mockActivate.mockRejectedValue(new Error("native module unavailable"));

    const { readCachedFlags } = await loadModule();

    await expect(readCachedFlags()).resolves.toEqual({});
  });

  it("does not strand the network fetch when activate keeps failing", async () => {
    // Only the cache read activates, so an `activate` that fails on every call must still leave
    // `fetchRemoteFlags` its documented fall-through to the network.
    mockActivate.mockRejectedValue(new Error("Internal error activating config"));

    const { readCachedFlags, fetchRemoteFlags } = await loadModule();
    await expect(readCachedFlags()).resolves.toEqual({});

    mockGetAll.mockReturnValue({
      feature_counter_value: value(JSON.stringify({ enabled: true })),
    });

    await expect(fetchRemoteFlags()).resolves.toEqual({ counterValue: { enabled: true } });
    expect(mockFetchAndActivate).toHaveBeenCalledTimes(1);
    expect(mockActivate).toHaveBeenCalledTimes(1);
  });

  it("applies settings and defaults once across the cache read and later fetches", async () => {
    const { readCachedFlags, fetchRemoteFlags } = await loadModule();

    await readCachedFlags();
    await fetchRemoteFlags();
    await fetchRemoteFlags();

    expect(mockSetSettings).toHaveBeenCalledTimes(1);
    expect(mockSetDefaultConfig).toHaveBeenCalledTimes(1);
    expect(mockActivate).toHaveBeenCalledTimes(1);
  });
});
