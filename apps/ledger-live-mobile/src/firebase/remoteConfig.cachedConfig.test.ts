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

const mockSetConfigSettings = jest.fn();
const mockSetDefaults = jest.fn();
const mockFetchAndActivate = jest.fn();
const mockEnsureInitialized = jest.fn();
const mockGetAll = jest.fn();
const mockGetRemoteConfig = jest.fn(() => ({
  setConfigSettings: (...args: unknown[]) => mockSetConfigSettings(...(args as [])),
  setDefaults: (...args: unknown[]) => mockSetDefaults(...(args as [])),
  fetchAndActivate: (...args: unknown[]) => mockFetchAndActivate(...(args as [])),
  ensureInitialized: (...args: unknown[]) => mockEnsureInitialized(...(args as [])),
  getAll: (...args: unknown[]) => mockGetAll(...(args as [])),
}));

jest.mock("@react-native-firebase/remote-config", () => ({
  getRemoteConfig: () => mockGetRemoteConfig(),
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
  mockSetConfigSettings.mockReset().mockResolvedValue(undefined);
  mockSetDefaults.mockReset().mockResolvedValue(undefined);
  mockFetchAndActivate.mockReset().mockResolvedValue(true);
  mockEnsureInitialized.mockReset().mockResolvedValue(undefined);
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

  it("does not call ensureInitialized, which fetches over the network on Android", async () => {
    // RNFB's Android `ensureInitialized` runs a blocking `fetchAndActivate` internally, so using
    // it as a barrier would put this read back on the network. `setup()` is the right barrier:
    // both of its calls return native constants and hydrate the value map from disk.
    const { readCachedFlags } = await loadModule();

    await readCachedFlags();

    expect(mockEnsureInitialized).not.toHaveBeenCalled();
    expect(mockSetConfigSettings).toHaveBeenCalled();
    expect(mockSetDefaults).toHaveBeenCalled();
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
    mockSetDefaults.mockRejectedValue(new Error("native module unavailable"));

    const { readCachedFlags } = await loadModule();

    await expect(readCachedFlags()).resolves.toEqual({});
  });

  it("does not strand the network fetch when the cache read fails", async () => {
    // `setup` is memoised at module scope and both readers await it, so a rejection kept in that
    // memo would be handed straight to `fetchRemoteFlags` and the documented fall-through to the
    // network would never happen. The memo holds successes only.
    mockSetDefaults.mockRejectedValueOnce(new Error("native module unavailable"));

    const { readCachedFlags, fetchRemoteFlags } = await loadModule();
    await expect(readCachedFlags()).resolves.toEqual({});

    mockGetAll.mockReturnValue({
      feature_counter_value: value(JSON.stringify({ enabled: true })),
    });

    await expect(fetchRemoteFlags()).resolves.toEqual({ counterValue: { enabled: true } });
    expect(mockFetchAndActivate).toHaveBeenCalledTimes(1);
  });
});
