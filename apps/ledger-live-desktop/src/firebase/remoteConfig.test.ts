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
  it("maps known Firebase keys to FeatureIds, drops unknown keys", async () => {
    mockGetAll.mockReturnValue({
      feature_counter_value: value(JSON.stringify({ enabled: true })),
      feature_lwd_wallet_40: value(JSON.stringify({ enabled: false, params: { mainNav: true } })),
      config_unrelated: value("\"ignored\""),
      stranger_key: value("\"ignored\""),
      feature_unknown_flag: value("\"ignored\""),
    });

    const { fetchRemoteFlags } = await loadModule();
    const result = await fetchRemoteFlags();

    expect(result).toEqual({
      counterValue: { enabled: true },
      lwdWallet40: { enabled: false, params: { mainNav: true } },
    });
  });

  it("resolves Firebase keys whose snake_case ↔ camelCase round-trip is lossy", async () => {
    // `lodash.camelCase(lodash.snakeCase(id))` is not an identity for FeatureIds that
    // contain digits or ≥2 consecutive uppercase letters. These four flags fail the
    // round-trip and were silently dropped by the previous camelCase-based decoder.
    mockGetAll.mockReturnValue({
      feature_llm_account_list_ui: value(JSON.stringify({ enabled: true })),
      feature_llm_reborn_lp: value(JSON.stringify({ enabled: true })),
      feature_web_3_hub: value(JSON.stringify({ enabled: true })),
      feature_ptx_swap_receive_trc_20_without_trx: value(JSON.stringify({ enabled: true })),
    });

    const { fetchRemoteFlags } = await loadModule();
    const result = await fetchRemoteFlags();

    expect(result).toEqual({
      llmAccountListUI: { enabled: true },
      llmRebornLP: { enabled: true },
      web3hub: { enabled: true },
      ptxSwapReceiveTRC20WithoutTrx: { enabled: true },
    });
  });

  it("matches Firebase keys case-insensitively", async () => {
    mockGetAll.mockReturnValue({
      Feature_Counter_Value: value(JSON.stringify({ enabled: true })),
      FEATURE_LWD_WALLET_40: value(JSON.stringify({ enabled: true })),
    });

    const { fetchRemoteFlags } = await loadModule();
    const result = await fetchRemoteFlags();

    expect(result).toEqual({
      counterValue: { enabled: true },
      lwdWallet40: { enabled: true },
    });
  });

  it("silently drops keys whose value is not valid JSON", async () => {
    mockGetAll.mockReturnValue({
      feature_counter_value: value(JSON.stringify({ enabled: true })),
      feature_lwd_wallet_40: value("not json"),
    });

    const { fetchRemoteFlags } = await loadModule();
    const result = await fetchRemoteFlags();

    expect(result).toEqual({ counterValue: { enabled: true } });
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
    mockGetAll.mockReturnValue({
      feature_counter_value: value(JSON.stringify({ enabled: true })),
    });
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
