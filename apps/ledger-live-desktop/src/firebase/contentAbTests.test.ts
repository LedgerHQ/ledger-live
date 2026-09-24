export {};

const mockInitializeApp = jest.fn(() => ({ name: "content-ab-tests" }));
const mockGetRemoteConfig = jest.fn(() => ({
  settings: { minimumFetchIntervalMillis: -1 },
}));
const mockFetchAndActivate = jest.fn();
const mockEnsureInitialized = jest.fn();
const mockGetAll = jest.fn();
const mockLoggerInfo = jest.fn();
const mockLoggerWarn = jest.fn();

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
  getContentAbTestsFirebaseConfig: () => ({ projectId: "content-ab-tests-lw" }),
}));
jest.mock("~/renderer/logger", () => ({
  __esModule: true,
  default: {
    info: (...args: unknown[]) => mockLoggerInfo(...args),
    warn: (...args: unknown[]) => mockLoggerWarn(...args),
  },
}));

const value = (raw: string, source: "remote" | "default" | "static" = "remote") => ({
  asString: () => raw,
  getSource: () => source,
});

async function loadModule() {
  return await import("./contentAbTests");
}

beforeEach(() => {
  jest.resetModules();
  mockInitializeApp.mockReset().mockReturnValue({ name: "content-ab-tests" } as never);
  mockGetRemoteConfig.mockReset().mockReturnValue({
    settings: { minimumFetchIntervalMillis: -1 },
  } as never);
  mockFetchAndActivate.mockReset().mockResolvedValue(true);
  mockEnsureInitialized.mockReset().mockResolvedValue(undefined);
  mockGetAll.mockReset().mockReturnValue({});
  mockLoggerInfo.mockReset();
  mockLoggerWarn.mockReset();
});

describe("fetchContentAbTests", () => {
  it("exposes valid remote payloads and logs fetch success", async () => {
    mockGetAll.mockReturnValue({
      feature_test: value(
        JSON.stringify({
          enabled: true,
          "upgrade.banner.title": "Discover bigger screen devices",
        }),
      ),
    });

    const { fetchContentAbTests, getContentAbTests } = await loadModule();
    const result = await fetchContentAbTests();

    expect(result).toEqual({
      test: {
        enabled: true,
        copy: { "upgrade.banner.title": "Discover bigger screen devices" },
      },
    });
    expect(getContentAbTests()).toEqual(result);
    expect(mockLoggerInfo).toHaveBeenCalledWith("Content AB tests: fetch succeeded", { count: 1 });
    expect(mockInitializeApp).toHaveBeenCalledWith(
      { projectId: "content-ab-tests-lw" },
      "content-ab-tests",
    );
  });

  it("logs the no-payload path when remote config is empty", async () => {
    mockGetAll.mockReturnValue({});
    const { fetchContentAbTests, getContentAbTests } = await loadModule();

    await expect(fetchContentAbTests()).resolves.toEqual({});
    expect(getContentAbTests()).toEqual({});
    expect(mockLoggerInfo).toHaveBeenCalledWith("Content AB tests: no payload");
  });

  it("keeps the previous payloads when the fetch fails", async () => {
    mockGetAll.mockReturnValue({
      feature_test: value(JSON.stringify({ enabled: true })),
    });
    const { fetchContentAbTests, getContentAbTests } = await loadModule();
    await fetchContentAbTests();

    mockFetchAndActivate.mockRejectedValueOnce(new Error("network down"));
    await expect(fetchContentAbTests()).resolves.toEqual({
      test: { enabled: true, copy: {} },
    });
    expect(getContentAbTests()).toEqual({ test: { enabled: true, copy: {} } });
    expect(mockLoggerWarn).toHaveBeenCalled();
  });

  it("does not throw when Firebase init fails", async () => {
    mockInitializeApp.mockImplementation(() => {
      throw new Error("indexed-db-unavailable");
    });
    const { fetchContentAbTests } = await loadModule();
    await expect(fetchContentAbTests()).resolves.toEqual({});
  });
});

describe("readCachedContentAbTests", () => {
  it("reads the cached config without fetching", async () => {
    mockGetAll.mockReturnValue({
      feature_test: value(JSON.stringify({ enabled: false })),
    });
    const { readCachedContentAbTests } = await loadModule();

    await expect(readCachedContentAbTests()).resolves.toEqual({
      test: { enabled: false, copy: {} },
    });
    expect(mockEnsureInitialized).toHaveBeenCalled();
    expect(mockFetchAndActivate).not.toHaveBeenCalled();
  });
});
