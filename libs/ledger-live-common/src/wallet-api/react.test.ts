/**
 * @jest-environment jsdom
 */
if (typeof globalThis.setImmediate !== "function") {
  // Force React scheduler to avoid MessageChannel in jsdom + detectOpenHandles.
  // @ts-expect-error Test-only polyfill for environments without setImmediate.
  globalThis.setImmediate = (callback: (...args: unknown[]) => void, ...args: unknown[]) => {
    setTimeout(() => callback(...args), 0);
  };
}
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const { renderHook, act, cleanup } = require("@testing-library/react");
import { initialState as walletState } from "@ledgerhq/live-wallet/store";
import { createFixtureAccount } from "../mock/fixtures/cryptoCurrencies";
import type { TrackingAPI } from "./tracking";
import type { useWalletAPIServerOptions } from "./react";

const mockSetHandler = jest.fn();
const mockSetConfig = jest.fn();
const mockSetPermissions = jest.fn();
const mockSetCustomHandlers = jest.fn();

jest.mock("@ledgerhq/wallet-api-server", () => ({
  WalletAPIServer: jest.fn().mockImplementation(() => ({
    setHandler: mockSetHandler,
    setConfig: mockSetConfig,
    setPermissions: mockSetPermissions,
    setCustomHandlers: mockSetCustomHandlers,
  })),
}));

jest.mock("react-redux", () => ({
  useDispatch: jest.fn().mockReturnValue(jest.fn()),
}));

jest.mock("../featureFlags/FeatureFlagsContext", () => ({
  useFeatureFlags: jest.fn().mockReturnValue({
    isFeature: () => true,
    getFeature: () => null,
    overrideFeature: jest.fn(),
    resetFeature: jest.fn(),
    resetFeatures: jest.fn(),
  }),
}));

jest.mock("../modularDrawer/hooks/useCurrenciesUnderFeatureFlag", () => ({
  useCurrenciesUnderFeatureFlag: jest.fn().mockReturnValue({
    featureFlaggedCurrencies: {},
    deactivatedCurrencyIds: new Set(),
  }),
}));

jest.mock("./FeatureFlags", () => ({
  handlers: jest.fn().mockReturnValue({ "custom.featureFlags.get": jest.fn() }),
}));

jest.mock("./converters", () => ({
  ...jest.requireActual("./converters"),
  setWalletApiIdForAccountId: jest.fn(),
}));

jest.mock("../hw/openTransportAsSubject", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@ledgerhq/cryptoassets/cal-client/state-manager/api", () => ({
  endpoints: {
    getTokensData: { initiate: jest.fn() },
  },
}));

jest.mock("@ledgerhq/cryptoassets/state", () => ({
  getCryptoAssetsStore: jest.fn().mockReturnValue({
    findTokenById: jest.fn().mockResolvedValue(null),
  }),
}));

jest.mock("../currencies", () => ({
  listSupportedCurrencies: jest.fn().mockReturnValue([]),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { useWalletAPIServer } = require("./react");

function createDefaultOptions(
  overrides?: Partial<useWalletAPIServerOptions>,
): useWalletAPIServerOptions {
  const tracking = createMockTracking();
  return {
    walletState,
    manifest: {
      id: "test-app",
      private: false,
      name: "Test App",
      url: "https://test.app",
      homepageUrl: "https://test.app",
      supportUrl: "https://test.app",
      icon: null,
      platforms: ["desktop"],
      apiVersion: "1.0.0",
      manifestVersion: "1.0.0",
      branch: "debug",
      params: undefined,
      categories: [],
      currencies: "*",
      content: {
        shortDescription: { en: "test" },
        description: { en: "test" },
      },
      permissions: [],
      domains: [],
      visibility: "complete" as const,
    },
    accounts: [createFixtureAccount("01"), createFixtureAccount("02")],
    tracking,
    config: {
      appId: "test-app-id",
      userId: "test-user-id",
      tracking: false,
      wallet: { name: "ledger-live-desktop", version: "1.0.0" },
    },
    webviewHook: {
      reload: jest.fn(),
      postMessage: jest.fn(),
    },
    uiHook: {},
    ...overrides,
  };
}

describe("useWalletAPIServer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("should return the expected shape", () => {
    const options = createDefaultOptions();
    const { result } = renderHook(() => useWalletAPIServer(options));

    expect(result.current).toHaveProperty("server");
    expect(result.current).toHaveProperty("onMessage");
    expect(result.current).toHaveProperty("onLoad");
    expect(result.current).toHaveProperty("onReload");
    expect(result.current).toHaveProperty("onLoadError");
    expect(result.current).toHaveProperty("widgetLoaded");

    expect(typeof result.current.onMessage).toBe("function");
    expect(typeof result.current.onLoad).toBe("function");
    expect(typeof result.current.onReload).toBe("function");
    expect(typeof result.current.onLoadError).toBe("function");
  });

  it("should start with widgetLoaded as false", () => {
    const options = createDefaultOptions();
    const { result } = renderHook(() => useWalletAPIServer(options));

    expect(result.current.widgetLoaded).toBe(false);
  });

  it("should set widgetLoaded to true when onLoad is called", () => {
    const options = createDefaultOptions();
    const { result } = renderHook(() => useWalletAPIServer(options));

    act(() => {
      result.current.onLoad();
    });

    expect(result.current.widgetLoaded).toBe(true);
  });

  it("should track load success when onLoad is called", () => {
    const options = createDefaultOptions();
    const { result } = renderHook(() => useWalletAPIServer(options));

    act(() => {
      result.current.onLoad();
    });

    expect(options.tracking.loadSuccess).toHaveBeenCalledWith(options.manifest);
  });

  it("should reset widgetLoaded to false when onReload is called", () => {
    const options = createDefaultOptions();
    const { result } = renderHook(() => useWalletAPIServer(options));

    act(() => {
      result.current.onLoad();
    });
    expect(result.current.widgetLoaded).toBe(true);

    act(() => {
      result.current.onReload();
    });
    expect(result.current.widgetLoaded).toBe(false);
  });

  it("should call webviewHook.reload when onReload is called", () => {
    const options = createDefaultOptions();
    const { result } = renderHook(() => useWalletAPIServer(options));

    act(() => {
      result.current.onReload();
    });

    expect(options.webviewHook.reload).toHaveBeenCalledTimes(1);
  });

  it("should track reload when onReload is called", () => {
    const options = createDefaultOptions();
    const { result } = renderHook(() => useWalletAPIServer(options));

    act(() => {
      result.current.onReload();
    });

    expect(options.tracking.reload).toHaveBeenCalledWith(options.manifest);
  });

  it("should track load failure when onLoadError is called", () => {
    const options = createDefaultOptions();
    const { result } = renderHook(() => useWalletAPIServer(options));

    act(() => {
      result.current.onLoadError();
    });

    expect(options.tracking.loadFail).toHaveBeenCalledWith(options.manifest);
  });

  it("should track load on mount", () => {
    const options = createDefaultOptions();
    renderHook(() => useWalletAPIServer(options));

    expect(options.tracking.load).toHaveBeenCalledWith(options.manifest);
  });

  it("should register handlers on the server", () => {
    const options = createDefaultOptions();
    renderHook(() => useWalletAPIServer(options));

    const registeredHandlers = mockSetHandler.mock.calls.map(([name]) => name);
    expect(registeredHandlers).toContain("currency.list");
    expect(registeredHandlers).toContain("account.list");
    expect(registeredHandlers).toContain("bitcoin.getAddress");
    expect(registeredHandlers).toContain("bitcoin.getAddresses");
    expect(registeredHandlers).toContain("bitcoin.getPublicKey");
    expect(registeredHandlers).toContain("bitcoin.getXPub");
    expect(registeredHandlers).toContain("device.open");
    expect(registeredHandlers).toContain("device.exchange");
    expect(registeredHandlers).toContain("device.close");
  });

  it("should register optional handlers only when uiHook callbacks are provided", () => {
    const uiAccountRequest = jest.fn();
    const options = createDefaultOptions({
      uiHook: { "account.request": uiAccountRequest },
    });
    renderHook(() => useWalletAPIServer(options));

    const registeredHandlers = mockSetHandler.mock.calls.map(([name]) => name);
    expect(registeredHandlers).toContain("account.request");
  });

  it("should not register account.request handler when uiHook callback is missing", () => {
    const options = createDefaultOptions({ uiHook: {} });
    renderHook(() => useWalletAPIServer(options));

    const registeredHandlers = mockSetHandler.mock.calls.map(([name]) => name);
    expect(registeredHandlers).not.toContain("account.request");
  });
});

function createMockTracking(): TrackingAPI {
  return {
    load: jest.fn(),
    reload: jest.fn(),
    loadFail: jest.fn(),
    loadSuccess: jest.fn(),
    signTransactionRequested: jest.fn(),
    signTransactionFail: jest.fn(),
    signTransactionSuccess: jest.fn(),
    signRawTransactionRequested: jest.fn(),
    signRawTransactionFail: jest.fn(),
    signRawTransactionSuccess: jest.fn(),
    requestAccountRequested: jest.fn(),
    requestAccountFail: jest.fn(),
    requestAccountSuccess: jest.fn(),
    receiveRequested: jest.fn(),
    receiveFail: jest.fn(),
    receiveSuccess: jest.fn(),
    broadcastFail: jest.fn(),
    broadcastSuccess: jest.fn(),
    broadcastOperationDetailsClick: jest.fn(),
    startExchangeRequested: jest.fn(),
    startExchangeSuccess: jest.fn(),
    startExchangeFail: jest.fn(),
    completeExchangeRequested: jest.fn(),
    completeExchangeSuccess: jest.fn(),
    completeExchangeFail: jest.fn(),
    signMessageRequested: jest.fn(),
    signMessageSuccess: jest.fn(),
    signMessageFail: jest.fn(),
    signMessageUserRefused: jest.fn(),
    deviceTransportRequested: jest.fn(),
    deviceTransportSuccess: jest.fn(),
    deviceTransportFail: jest.fn(),
    deviceSelectRequested: jest.fn(),
    deviceSelectSuccess: jest.fn(),
    deviceSelectFail: jest.fn(),
    deviceOpenRequested: jest.fn(),
    deviceExchangeRequested: jest.fn(),
    deviceExchangeSuccess: jest.fn(),
    deviceExchangeFail: jest.fn(),
    deviceCloseRequested: jest.fn(),
    deviceCloseSuccess: jest.fn(),
    deviceCloseFail: jest.fn(),
    bitcoinFamilyAccountAddressRequested: jest.fn(),
    bitcoinFamilyAccountAddressFail: jest.fn(),
    bitcoinFamilyAccountAddressSuccess: jest.fn(),
    bitcoinFamilyAccountPublicKeyRequested: jest.fn(),
    bitcoinFamilyAccountPublicKeyFail: jest.fn(),
    bitcoinFamilyAccountPublicKeySuccess: jest.fn(),
    bitcoinFamilyAccountXpubRequested: jest.fn(),
    bitcoinFamilyAccountXpubFail: jest.fn(),
    bitcoinFamilyAccountXpubSuccess: jest.fn(),
    bitcoinFamilyAccountAddressesRequested: jest.fn(),
    bitcoinFamilyAccountAddressesFail: jest.fn(),
    bitcoinFamilyAccountAddressesSuccess: jest.fn(),
    currencyListRequested: jest.fn(),
    currencyListSuccess: jest.fn(),
    currencyListFail: jest.fn(),
    accountListRequested: jest.fn(),
    accountListSuccess: jest.fn(),
    accountListFail: jest.fn(),
    dappSendTransactionRequested: jest.fn(),
    dappSendTransactionSuccess: jest.fn(),
    dappSendTransactionFail: jest.fn(),
    dappPersonalSignRequested: jest.fn(),
    dappPersonalSignSuccess: jest.fn(),
    dappPersonalSignFail: jest.fn(),
    dappSignTypedDataRequested: jest.fn(),
    dappSignTypedDataSuccess: jest.fn(),
    dappSignTypedDataFail: jest.fn(),
  } as unknown as TrackingAPI;
}
