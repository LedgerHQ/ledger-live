// Use the real module under test, overriding the default mock that other tests
// in this app rely on via `__tests__/jest-setup.js`.
jest.unmock("~/firebase/remoteConfig");

const mockSetSettings = jest.fn();
const mockSetDefaultConfig = jest.fn();
const mockActivate = jest.fn();
const mockFetchAndActivate = jest.fn();
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
  mockGetAll.mockReset().mockReturnValue({});
});

describe("fetchRemoteFlags", () => {
  it("maps known Firebase keys to FeatureIds, drops unknown keys", async () => {
    mockGetAll.mockReturnValue({
      feature_counter_value: value(JSON.stringify({ enabled: true })),
      feature_lwm_wallet_40: value(JSON.stringify({ enabled: false, params: { mainNav: true } })),
      feature_copy_upgrade_banner: value(
        JSON.stringify({
          enabled: true,
          copy: { "upgrade.banner.title": "Discover Ledger Flex" },
        }),
      ),
      config_unrelated: value('"ignored"'),
      stranger_key: value('"ignored"'),
      feature_unknown_flag: value('"ignored"'),
    });

    const { fetchRemoteFlags } = await loadModule();
    const result = await fetchRemoteFlags();

    expect(result).toEqual({
      counterValue: { enabled: true },
      lwmWallet40: { enabled: false, params: { mainNav: true } },
    });
    const { getContentAbTestCopy } = await import("@features/platform-content-ab-tests");
    expect(getContentAbTestCopy()).toEqual({
      "upgrade.banner.title": "Discover Ledger Flex",
    });
    expect(mockGetAll).toHaveBeenCalledTimes(1);
  });

  it("resolves Firebase keys whose snake_case ↔ camelCase round-trip is lossy", async () => {
    // `lodash.camelCase(lodash.snakeCase(id))` is not an identity for FeatureIds that
    // contain digits or ≥2 consecutive uppercase letters. These flags fail the
    // round-trip and were silently dropped by the previous camelCase-based decoder.
    mockGetAll.mockReturnValue({
      feature_llm_account_list_ui: value(JSON.stringify({ enabled: true })),
      feature_web_3_hub: value(JSON.stringify({ enabled: true })),
      feature_ptx_swap_receive_trc_20_without_trx: value(JSON.stringify({ enabled: true })),
    });

    const { fetchRemoteFlags } = await loadModule();
    const result = await fetchRemoteFlags();

    expect(result).toEqual({
      llmAccountListUI: { enabled: true },
      web3hub: { enabled: true },
      ptxSwapReceiveTRC20WithoutTrx: { enabled: true },
    });
  });

  it("matches Firebase keys case-insensitively", async () => {
    mockGetAll.mockReturnValue({
      Feature_Counter_Value: value(JSON.stringify({ enabled: true })),
      FEATURE_LWM_WALLET_40: value(JSON.stringify({ enabled: true })),
    });

    const { fetchRemoteFlags } = await loadModule();
    const result = await fetchRemoteFlags();

    expect(result).toEqual({
      counterValue: { enabled: true },
      lwmWallet40: { enabled: true },
    });
  });

  it("silently drops keys whose value is not valid JSON", async () => {
    mockGetAll.mockReturnValue({
      feature_counter_value: value(JSON.stringify({ enabled: true })),
      feature_lwm_wallet_40: value("not json"),
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

  it("applies settings and defaults exactly once across multiple fetches, without activating", async () => {
    const { fetchRemoteFlags } = await loadModule();

    await fetchRemoteFlags();
    await fetchRemoteFlags();
    await fetchRemoteFlags();

    expect(mockSetSettings).toHaveBeenCalledTimes(1);
    expect(mockSetSettings).toHaveBeenCalledWith({
      fetchTimeoutMillis: 60000,
      minimumFetchIntervalMillis: 0,
    });
    expect(mockSetDefaultConfig).toHaveBeenCalledTimes(1);
    expect(mockSetDefaultConfig).toHaveBeenCalledWith({
      feature_mock_feature: JSON.stringify({ enabled: false }),
    });
    expect(mockActivate).not.toHaveBeenCalled();
  });

  it("applies settings and defaults before calling fetchAndActivate", async () => {
    const calls: string[] = [];
    mockSetSettings.mockImplementation(() => calls.push("settings"));
    mockSetDefaultConfig.mockImplementation(() => calls.push("defaultConfig"));
    mockFetchAndActivate.mockImplementation(async () => {
      calls.push("fetchAndActivate");
      return true;
    });

    const { fetchRemoteFlags } = await loadModule();
    await fetchRemoteFlags();

    expect(calls).toEqual(["settings", "defaultConfig", "fetchAndActivate"]);
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
    const { fetchRemoteFlags, subscribeToRemoteFlags } = await loadModule();

    await fetchRemoteFlags();

    const late = jest.fn();
    subscribeToRemoteFlags(late);
    expect(late).toHaveBeenCalledTimes(1);
    expect(late).toHaveBeenCalledWith({ fetchedAt: expect.any(Number) });
  });

  it("removes a subscriber when its unsubscribe is invoked", async () => {
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
