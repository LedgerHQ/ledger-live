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

const mockSettingsSetter = jest.fn();
const mockDefaultConfigSetter = jest.fn();
const mockActivate = jest.fn();
const mockFetchAndActivate = jest.fn();
const mockGetAll = jest.fn();

const mockRc = {
  get settings() {
    return { fetchTimeoutMillis: 60000, minimumFetchIntervalMillis: 43200000 };
  },
  set settings(value: unknown) {
    mockSettingsSetter(value);
  },
  set defaultConfig(value: unknown) {
    mockDefaultConfigSetter(value);
  },
};
const mockGetRemoteConfig = jest.fn(() => mockRc);

jest.mock("@react-native-firebase/remote-config", () => ({
  getRemoteConfig: () => mockGetRemoteConfig(),
  activate: (...args: unknown[]) => mockActivate(...(args as [])),
  fetchAndActivate: (...args: unknown[]) => mockFetchAndActivate(...(args as [])),
  getAll: (...args: unknown[]) => mockGetAll(...(args as [])),
  getValue: () => undefined,
}));
jest.mock("@features/platform-feature-flags", () => ({
  DEFAULT_FEATURES: { mockFeature: { enabled: false } },
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
  mockSettingsSetter.mockReset();
  mockDefaultConfigSetter.mockReset();
  mockActivate.mockReset().mockResolvedValue(false);
  mockFetchAndActivate.mockReset().mockResolvedValue(true);
  mockGetAll.mockReset().mockReturnValue({});
  mockGetRemoteConfig.mockClear();
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
    });

    const { readCachedFlags } = await loadModule();

    await expect(readCachedFlags()).resolves.toEqual({
      llmWalletSync: {
        enabled: true,
        params: { environment: "PROD", watchConfig: {}, learnMoreLink: "" },
      },
    });
    expect(mockFetchAndActivate).not.toHaveBeenCalled();
  });

  it("hydrates via activate() rather than a network fetch", async () => {
    // `activate()` doesn't hit the network (it only activates whatever the native SDK already
    // fetched/persisted), unlike `ensureInitialized()` which on Android runs a blocking
    // `fetchAndActivate` internally. `setup()` uses `activate()` as its barrier for exactly
    // that reason.
    const { readCachedFlags } = await loadModule();

    await readCachedFlags();

    expect(mockActivate).toHaveBeenCalledTimes(1);
    expect(mockSettingsSetter).toHaveBeenCalled();
    expect(mockDefaultConfigSetter).toHaveBeenCalled();
    expect(mockFetchAndActivate).not.toHaveBeenCalled();
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

  it("resolves empty when the native module cannot be reached", async () => {
    mockActivate.mockRejectedValue(new Error("native module unavailable"));

    const { readCachedFlags } = await loadModule();

    await expect(readCachedFlags()).resolves.toEqual({});
  });

  it("does not strand the network fetch when the cache read fails", async () => {
    // `setup` is memoised at module scope and both readers await it, so a rejection kept in that
    // memo would be handed straight to `fetchRemoteFlags` and the documented fall-through to the
    // network would never happen. The memo holds successes only.
    mockActivate.mockRejectedValueOnce(new Error("native module unavailable"));

    const { readCachedFlags, fetchRemoteFlags } = await loadModule();
    await expect(readCachedFlags()).resolves.toEqual({});

    mockGetAll.mockReturnValue({
      feature_counter_value: value(JSON.stringify({ enabled: true })),
    });

    await expect(fetchRemoteFlags()).resolves.toEqual({ counterValue: { enabled: true } });
    expect(mockFetchAndActivate).toHaveBeenCalledTimes(1);
  });
});
