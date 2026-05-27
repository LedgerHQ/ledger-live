const mockInitializeApp = jest.fn(() => ({ name: "test-app" }));
const mockGetRemoteConfig = jest.fn(() => ({
  settings: { minimumFetchIntervalMillis: -1 },
  defaultConfig: {} as Record<string, string>,
}));
const mockFetchAndActivate = jest.fn();
const mockGetAll = jest.fn();

jest.mock("firebase/app", () => ({
  initializeApp: (...args: unknown[]) => mockInitializeApp(...(args as [])),
}));
jest.mock("firebase/remote-config", () => ({
  getRemoteConfig: (...args: unknown[]) => mockGetRemoteConfig(...(args as [])),
  fetchAndActivate: (...args: unknown[]) => mockFetchAndActivate(...(args as [])),
  getAll: (...args: unknown[]) => mockGetAll(...(args as [])),
}));
jest.mock("~/firebase-setup", () => ({
  getFirebaseConfig: () => ({ projectId: "test" }),
}));
jest.mock("@ledgerhq/live-common/featureFlags/index", () => ({
  DEFAULT_FEATURES: { mockFeature: { enabled: false } },
  formatDefaultFeatures: () => ({ feature_mock_feature: JSON.stringify({ enabled: false }) }),
}));

const value = (raw: string) => ({ asString: () => raw });

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
  mockGetAll.mockReset().mockReturnValue({});
});

describe("fetchRemoteFlags", () => {
  it("filters out non-feature keys, strips feature_ prefix, and camelCases", async () => {
    mockGetAll.mockReturnValue({
      feature_mock_feature: value(JSON.stringify({ enabled: true })),
      feature_some_other_flag: value(JSON.stringify({ enabled: false, params: { x: 1 } })),
      config_unrelated: value("\"ignored\""),
      stranger_key: value("\"ignored\""),
    });

    const { fetchRemoteFlags } = await loadModule();
    const result = await fetchRemoteFlags();

    expect(result).toEqual({
      mockFeature: { enabled: true },
      someOtherFlag: { enabled: false, params: { x: 1 } },
    });
  });

  it("silently drops keys whose value is not valid JSON", async () => {
    mockGetAll.mockReturnValue({
      feature_good: value(JSON.stringify({ enabled: true })),
      feature_bad: value("not json"),
    });

    const { fetchRemoteFlags } = await loadModule();
    const result = await fetchRemoteFlags();

    expect(result).toEqual({ good: { enabled: true } });
  });

  it("propagates the fetchAndActivate failure (middleware swallows it)", async () => {
    mockFetchAndActivate.mockRejectedValue(new Error("network down"));
    const { fetchRemoteFlags } = await loadModule();
    await expect(fetchRemoteFlags()).rejects.toThrow("network down");
  });

  it("initializes the Firebase app and configures remote config exactly once", async () => {
    mockGetAll.mockReturnValue({});
    const { fetchRemoteFlags } = await loadModule();
    await fetchRemoteFlags();
    await fetchRemoteFlags();
    await fetchRemoteFlags();
    expect(mockInitializeApp).toHaveBeenCalledTimes(1);
    expect(mockGetRemoteConfig).toHaveBeenCalledTimes(1);
  });

  it("sets minimumFetchIntervalMillis=0 and defaultConfig on first access", async () => {
    const rcInstance = { settings: { minimumFetchIntervalMillis: -1 }, defaultConfig: {} };
    mockGetRemoteConfig.mockReturnValue(rcInstance as never);
    mockGetAll.mockReturnValue({});

    const { fetchRemoteFlags } = await loadModule();
    await fetchRemoteFlags();

    expect(rcInstance.settings.minimumFetchIntervalMillis).toBe(0);
    expect(rcInstance.defaultConfig).toEqual({
      feature_mock_feature: JSON.stringify({ enabled: false }),
    });
  });
});

describe("subscribeToRemoteFlags", () => {
  it("notifies every subscriber after a successful fetch", async () => {
    mockGetAll.mockReturnValue({ feature_mock_feature: value(JSON.stringify({ enabled: true })) });
    const { fetchRemoteFlags, subscribeToRemoteFlags } = await loadModule();

    const a = jest.fn();
    const b = jest.fn();
    subscribeToRemoteFlags(a);
    subscribeToRemoteFlags(b);

    await fetchRemoteFlags();

    expect(a).toHaveBeenCalledWith({ fetchedAt: expect.any(Number) });
    expect(b).toHaveBeenCalledWith({ fetchedAt: expect.any(Number) });
  });

  it("does not notify subscribers on fetch failure", async () => {
    mockFetchAndActivate.mockRejectedValue(new Error("network down"));
    const { fetchRemoteFlags, subscribeToRemoteFlags } = await loadModule();
    const cb = jest.fn();
    subscribeToRemoteFlags(cb);

    await expect(fetchRemoteFlags()).rejects.toThrow("network down");
    expect(cb).not.toHaveBeenCalled();
  });

  it("replays the last successful fetch to a late subscriber", async () => {
    mockGetAll.mockReturnValue({});
    const { fetchRemoteFlags, subscribeToRemoteFlags } = await loadModule();

    await fetchRemoteFlags();

    const late = jest.fn();
    subscribeToRemoteFlags(late);
    expect(late).toHaveBeenCalledTimes(1);
    expect(late).toHaveBeenCalledWith({ fetchedAt: expect.any(Number) });
  });

  it("removes a subscriber when its unsubscribe is invoked", async () => {
    mockGetAll.mockReturnValue({});
    const { fetchRemoteFlags, subscribeToRemoteFlags } = await loadModule();
    const cb = jest.fn();
    const unsubscribe = subscribeToRemoteFlags(cb);

    await fetchRemoteFlags();
    expect(cb).toHaveBeenCalledTimes(1);

    unsubscribe();
    await fetchRemoteFlags();
    expect(cb).toHaveBeenCalledTimes(1);
  });
});

describe("whenReady", () => {
  it("resolves after the first successful fetch", async () => {
    mockGetAll.mockReturnValue({});
    const { fetchRemoteFlags, whenReady } = await loadModule();

    let resolved = false;
    void whenReady().then(() => {
      resolved = true;
    });

    await Promise.resolve();
    expect(resolved).toBe(false);

    await fetchRemoteFlags();
    await Promise.resolve();
    expect(resolved).toBe(true);
  });

  it("resolves even when the first fetch fails (so boot is not blocked)", async () => {
    mockFetchAndActivate.mockRejectedValue(new Error("network down"));
    const { fetchRemoteFlags, whenReady } = await loadModule();

    let resolved = false;
    void whenReady().then(() => {
      resolved = true;
    });

    await fetchRemoteFlags().catch(() => null);
    await Promise.resolve();
    expect(resolved).toBe(true);
  });
});
