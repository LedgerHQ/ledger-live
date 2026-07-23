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
import { createFixtureAccount } from "../../../mock/fixtures/cryptoCurrencies";
import type { TrackingAPI } from "../../tracking";
import type { useWalletAPIServerOptions } from "../types";

const mockSetHandler = jest.fn();
const mockSetConfig = jest.fn();
const mockSetPermissions = jest.fn();
const mockSetCustomHandlers = jest.fn();
const mockServerConstructor = jest.fn();

jest.mock("@ledgerhq/wallet-api-server", () => ({
  WalletAPIServer: jest.fn().mockImplementation((...args: unknown[]) => {
    mockServerConstructor(...args);
    return {
      setHandler: mockSetHandler,
      setConfig: mockSetConfig,
      setPermissions: mockSetPermissions,
      setCustomHandlers: mockSetCustomHandlers,
    };
  }),
}));

jest.mock("react-redux", () => ({
  useDispatch: jest.fn().mockReturnValue(jest.fn()),
}));

jest.mock("@features/platform-feature-flags", () => ({
  useFeatureFlags: jest.fn().mockReturnValue({ someFlag: { enabled: true } }),
}));

jest.mock("../../../modularDrawer/hooks/useCurrenciesUnderFeatureFlag", () => ({
  useCurrenciesUnderFeatureFlag: jest.fn().mockReturnValue({
    featureFlaggedCurrencies: {},
    deactivatedCurrencyIds: new Set(),
  }),
}));

const mockFeatureFlagsHandlers = jest
  .fn()
  .mockReturnValue({ "custom.featureFlags.get": jest.fn() });
jest.mock("../../FeatureFlags", () => ({
  handlers: (...args: unknown[]) => mockFeatureFlagsHandlers(...args),
}));

jest.mock("../../converters", () => ({
  ...jest.requireActual("../../converters"),
  setWalletApiIdForAccountId: jest.fn(),
}));

const mockTransportSubject = {
  subscribe: jest.fn(),
  complete: jest.fn(),
  next: jest.fn(),
  pipe: jest.fn().mockReturnThis(),
};
const mockOpenTransportAsSubject = jest.fn((..._args: unknown[]) => mockTransportSubject);
jest.mock("../../../hw/openTransportAsSubject", () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockOpenTransportAsSubject(...args),
}));

jest.mock("@domain/api-currency-token", () => ({
  cryptoAssetsApi: {
    endpoints: {
      getTokensData: { initiate: jest.fn() },
    },
  },
}));

jest.mock("@ledgerhq/ledger-wallet-framework/cryptoAssetsStore", () => ({
  getCryptoAssetsStore: jest.fn().mockReturnValue({
    findTokenById: jest.fn().mockResolvedValue(null),
  }),
}));

jest.mock("../../../currencies", () => ({
  listSupportedCurrencies: jest.fn().mockReturnValue([]),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const { useWalletAPIServer } = require("../useWalletAPIServer");

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

  describe("returned shape", () => {
    it("returns server and the expected callbacks", () => {
      const options = createDefaultOptions();
      const { result } = renderHook(() => useWalletAPIServer(options));

      expect(result.current).toHaveProperty("server");
      expect(typeof result.current.onMessage).toBe("function");
      expect(typeof result.current.onLoad).toBe("function");
      expect(typeof result.current.onReload).toBe("function");
      expect(typeof result.current.onLoadError).toBe("function");
      expect(result.current.widgetLoaded).toBe(false);
    });

    it("creates the WalletAPIServer once with transport, config and merged handlers", () => {
      const options = createDefaultOptions();
      const { rerender } = renderHook(props => useWalletAPIServer(props), {
        initialProps: options,
      });

      expect(mockServerConstructor).toHaveBeenCalledTimes(1);
      const [transport, config, third, customHandlers] = mockServerConstructor.mock.calls[0];
      expect(transport).toHaveProperty("send");
      expect(config).toBe(options.config);
      expect(third).toBeUndefined();
      expect(customHandlers).toHaveProperty(["custom.featureFlags.get"]);

      // re-render must not recreate the server
      rerender(createDefaultOptions());
      expect(mockServerConstructor).toHaveBeenCalledTimes(1);
    });
  });

  describe("widget lifecycle", () => {
    it("sets widgetLoaded to true and tracks success on onLoad", () => {
      const options = createDefaultOptions();
      const { result } = renderHook(() => useWalletAPIServer(options));

      act(() => result.current.onLoad());

      expect(result.current.widgetLoaded).toBe(true);
      expect(options.tracking.loadSuccess).toHaveBeenCalledWith(options.manifest);
    });

    it("resets widgetLoaded, reloads webview and tracks on onReload", () => {
      const options = createDefaultOptions();
      const { result } = renderHook(() => useWalletAPIServer(options));

      act(() => result.current.onLoad());
      expect(result.current.widgetLoaded).toBe(true);

      act(() => result.current.onReload());

      expect(result.current.widgetLoaded).toBe(false);
      expect(options.webviewHook.reload).toHaveBeenCalledTimes(1);
      expect(options.tracking.reload).toHaveBeenCalledWith(options.manifest);
    });

    it("tracks load failure on onLoadError", () => {
      const options = createDefaultOptions();
      const { result } = renderHook(() => useWalletAPIServer(options));

      act(() => result.current.onLoadError());

      expect(options.tracking.loadFail).toHaveBeenCalledWith(options.manifest);
    });

    it("tracks load on mount", () => {
      const options = createDefaultOptions();
      renderHook(() => useWalletAPIServer(options));

      expect(options.tracking.load).toHaveBeenCalledWith(options.manifest);
    });

    it("onMessage forwards to the transport without throwing", () => {
      const options = createDefaultOptions();
      const { result } = renderHook(() => useWalletAPIServer(options));

      expect(() => act(() => result.current.onMessage("hello"))).not.toThrow();
    });
  });

  describe("server side-effect syncing", () => {
    it("registers the full set of handlers", () => {
      const options = createDefaultOptions();
      renderHook(() => useWalletAPIServer(options));

      const registered = mockSetHandler.mock.calls.map(([name]) => name);
      [
        "currency.list",
        "account.list",
        "account.request",
        "account.receive",
        "message.sign",
        "storage.get",
        "storage.set",
        "bitcoin.signPsbt",
        "transaction.sign",
        "transaction.signRaw",
        "transaction.signAndBroadcast",
        "device.transport",
        "device.select",
        "device.open",
        "device.exchange",
        "device.close",
        "bitcoin.getAddress",
        "bitcoin.getAddresses",
        "bitcoin.getPublicKey",
        "bitcoin.getXPub",
        "exchange.start",
        "exchange.complete",
      ].forEach(name => expect(registered).toContain(name));
    });

    it("syncs config, permissions and custom handlers on mount", () => {
      const options = createDefaultOptions();
      renderHook(() => useWalletAPIServer(options));

      expect(mockSetConfig).toHaveBeenCalledWith(options.config);
      expect(mockSetPermissions).toHaveBeenCalledWith({ methodIds: options.manifest.permissions });
      expect(mockSetCustomHandlers).toHaveBeenCalledTimes(1);
    });

    it("re-syncs config when the config prop changes", () => {
      const { rerender } = renderHook(props => useWalletAPIServer(props), {
        initialProps: createDefaultOptions(),
      });
      expect(mockSetConfig).toHaveBeenCalledTimes(1);

      const newConfig = {
        appId: "other",
        userId: "other-user",
        tracking: true,
        wallet: { name: "ledger-live-desktop", version: "2.0.0" },
      };
      act(() => {
        rerender(createDefaultOptions({ config: newConfig }));
      });

      expect(mockSetConfig).toHaveBeenLastCalledWith(newConfig);
    });
  });

  describe("custom handlers", () => {
    it("merges caller-provided custom handlers with the feature flags handlers", () => {
      const customHandler = jest.fn();
      const options = createDefaultOptions({
        customHandlers: { "custom.thing": customHandler } as unknown as never,
      });
      renderHook(() => useWalletAPIServer(options));

      const mergedArg = mockSetCustomHandlers.mock.calls[0][0];
      expect(mergedArg).toHaveProperty(["custom.featureFlags.get"]);
      expect(mergedArg).toHaveProperty(["custom.thing"]);
    });
  });

  describe("device transport", () => {
    function getHandler(name: string) {
      const call = mockSetHandler.mock.calls.find(([n]) => n === name);
      return call?.[1];
    }

    it("opens a device transport via device.open and subscribes", () => {
      const options = createDefaultOptions();
      renderHook(() => useWalletAPIServer(options));

      const open = getHandler("device.open");
      const result = open({ deviceId: "device-1" });

      expect(mockOpenTransportAsSubject).toHaveBeenCalledWith({ deviceId: "device-1" });
      expect(mockTransportSubject.subscribe).toHaveBeenCalled();
      expect(result).toBe("1");
    });

    it("rejects device.exchange when no device is opened", async () => {
      const options = createDefaultOptions();
      renderHook(() => useWalletAPIServer(options));

      // closing first clears any transport opened by a previous test in the suite
      const close = getHandler("device.close");
      await close({ transportId: "t" }).catch(() => undefined);

      const exchange = getHandler("device.exchange");
      await expect(exchange({ apduHex: "00" })).rejects.toThrow("No device opened");
    });

    it("performs an exchange and resolves on a device-response event", async () => {
      const options = createDefaultOptions();
      renderHook(() => useWalletAPIServer(options));

      // open to populate the transport ref
      getHandler("device.open")({ deviceId: "device-1" });

      // emulate the rxjs pipe(first(...)).subscribe by invoking next with a response
      mockTransportSubject.subscribe.mockImplementationOnce(observer => {
        observer.next({ type: "device-response", data: "apduResponse" });
      });

      const exchange = getHandler("device.exchange");
      await expect(exchange({ apduHex: "abcd" })).resolves.toBe("apduResponse");
      expect(mockTransportSubject.next).toHaveBeenCalledWith({
        type: "input-frame",
        apduHex: "abcd",
      });
    });

    it("rejects an exchange on an error event", async () => {
      const options = createDefaultOptions();
      renderHook(() => useWalletAPIServer(options));

      getHandler("device.open")({ deviceId: "device-1" });

      mockTransportSubject.subscribe.mockImplementationOnce(observer => {
        observer.next({ type: "error", error: new Error("boom") });
      });

      const exchange = getHandler("device.exchange");
      await expect(exchange({ apduHex: "abcd" })).rejects.toThrow("boom");
    });

    it("closes an opened device via device.close", async () => {
      const options = createDefaultOptions();
      renderHook(() => useWalletAPIServer(options));

      getHandler("device.open")({ deviceId: "device-1" });

      const close = getHandler("device.close");
      await expect(close({ transportId: "transport-1" })).resolves.toBe("transport-1");
      expect(mockTransportSubject.complete).toHaveBeenCalled();
    });
  });

  describe("uiHook wiring", () => {
    it("registers account.request even when the uiHook callback is missing", () => {
      const options = createDefaultOptions({ uiHook: {} });
      renderHook(() => useWalletAPIServer(options));

      const registered = mockSetHandler.mock.calls.map(([name]) => name);
      expect(registered).toContain("account.request");
    });

    it("registers handlers when uiHook callbacks are provided", () => {
      const options = createDefaultOptions({
        uiHook: {
          "account.request": jest.fn(),
          "message.sign": jest.fn(),
        },
      });
      renderHook(() => useWalletAPIServer(options));

      const registered = mockSetHandler.mock.calls.map(([name]) => name);
      expect(registered).toContain("account.request");
      expect(registered).toContain("message.sign");
    });
  });
});

function createMockTracking(): TrackingAPI {
  const cache: Record<string, jest.Mock> = {};
  return new Proxy(
    {},
    {
      get: (_target, prop: string) => {
        if (!cache[prop]) {
          cache[prop] = jest.fn();
        }
        return cache[prop];
      },
    },
  ) as unknown as TrackingAPI;
}
