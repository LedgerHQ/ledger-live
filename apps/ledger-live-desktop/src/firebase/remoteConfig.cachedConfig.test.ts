// The Firebase JS SDK persists its last *activated* config in IndexedDB. That config is the
// app's only memory of the previous session's flags: the Redux slice persists local overrides
// only, and the middleware's remote map is closure-private and rebuilt from `{}` on every boot.
//
// `readCachedFlags` serves it without touching the network, so boot resolves on last-known-good
// instead of compiled defaults.

// Declared as a module so its locals do not collide with the sibling `remoteConfig.test.ts`,
// which has no top-level import/export and therefore lives in the global scope.
export {};

const mockInitializeApp = jest.fn(() => ({ name: "test-app" }));
const mockGetRemoteConfig = jest.fn(() => ({
  settings: { minimumFetchIntervalMillis: -1 },
  defaultConfig: {} as Record<string, string>,
}));
const mockFetchAndActivate = jest.fn();
const mockEnsureInitialized = jest.fn();
const mockGetAll = jest.fn();

jest.mock("firebase/app", () => ({
  initializeApp: (...args: unknown[]) => mockInitializeApp(...(args as [])),
}));
jest.mock("firebase/remote-config", () => ({
  getRemoteConfig: (...args: unknown[]) => mockGetRemoteConfig(...(args as [])),
  fetchAndActivate: (...args: unknown[]) => mockFetchAndActivate(...(args as [])),
  ensureInitialized: (...args: unknown[]) => mockEnsureInitialized(...(args as [])),
  getAll: (...args: unknown[]) => mockGetAll(...(args as [])),
}));
jest.mock("~/firebase-setup", () => ({
  getFirebaseConfig: () => ({ projectId: "test" }),
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
  mockInitializeApp.mockReset().mockReturnValue({ name: "test-app" } as never);
  mockGetRemoteConfig
    .mockReset()
    .mockReturnValue({ settings: { minimumFetchIntervalMillis: -1 }, defaultConfig: {} } as never);
  mockFetchAndActivate.mockReset().mockResolvedValue(true);
  mockEnsureInitialized.mockReset().mockResolvedValue(undefined);
  mockGetAll.mockReset().mockReturnValue({});
});

describe("readCachedFlags", () => {
  it("serves the last activated config without touching the network", async () => {
    mockGetAll.mockReturnValue({
      feature_lld_wallet_sync: value(
        JSON.stringify({
          enabled: true,
          params: { environment: "PROD", watchConfig: {}, learnMoreLink: "" },
        }),
      ),
    });

    const { readCachedFlags } = await loadModule();

    await expect(readCachedFlags()).resolves.toEqual({
      lldWalletSync: {
        enabled: true,
        params: { environment: "PROD", watchConfig: {}, learnMoreLink: "" },
      },
    });
    expect(mockEnsureInitialized).toHaveBeenCalled();
    expect(mockFetchAndActivate).not.toHaveBeenCalled();
  });

  it("excludes entries served from the compiled defaults", async () => {
    // `getAll` unions the activated config with `defaultConfig`. Only the former is a value
    // Firebase actually sent; the latter would otherwise masquerade as remote.
    mockGetAll.mockReturnValue({
      feature_counter_value: value(JSON.stringify({ enabled: true }), "remote"),
      feature_lld_wallet_sync: value(JSON.stringify({ enabled: false }), "default"),
      feature_lwd_wallet_40: value(JSON.stringify({ enabled: false }), "static"),
    });

    const { readCachedFlags } = await loadModule();

    await expect(readCachedFlags()).resolves.toEqual({ counterValue: { enabled: true } });
  });

  it("resolves empty when storage cannot be opened", async () => {
    // `ensureInitialized` rejects when IndexedDB refuses to open, and memoises the rejection.
    // An unreadable cache must not break boot.
    mockEnsureInitialized.mockRejectedValue(new Error("storage-open"));

    const { readCachedFlags } = await loadModule();

    await expect(readCachedFlags()).resolves.toEqual({});
  });

  it("resolves empty when the SDK refuses to instantiate", async () => {
    mockGetRemoteConfig.mockImplementation(() => {
      throw new Error("indexed-db-unavailable");
    });

    const { readCachedFlags } = await loadModule();

    await expect(readCachedFlags()).resolves.toEqual({});
  });
});
