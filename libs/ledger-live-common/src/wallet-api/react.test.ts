/**
 * @jest-environment jsdom
 */
import { renderHook, act, cleanup, waitFor } from "@testing-library/react";
import BigNumber from "bignumber.js";
import type { WalletHandlers } from "@ledgerhq/wallet-api-server";
import type { AccountNamesState } from "@domain/entity-account-name";
import { createFixtureAccount } from "../mock/fixtures/cryptoCurrencies";
import type { TrackingAPI } from "./tracking";
import { type UiHook, type useWalletAPIServerOptions, useDappSessionUiHook } from "./react";
import { AccountPublicKeyUnavailable, BridgeSessionClosed } from "../errors";
import { accountGetPublicKeyLogic } from "./logic";
import { BridgeSession } from "./bridgeSession";
import { liveBlindSigningReporter } from "@ledgerhq/live-dmk-shared";
import { useEffect } from "react";
import { WalletAPIServer } from "@ledgerhq/wallet-api-server";
import {
  getAccountIdFromWalletAccountId,
  resolveWalletApiSpendableBalance,
  resolveWalletApiMaxSpendable,
} from "./converters";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import openTransportAsSubject from "../hw/openTransportAsSubject";

const walletState: AccountNamesState = new Map();
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

jest.mock("@features/platform-feature-flags", () => ({
  useFeatureFlags: jest.fn().mockReturnValue({}),
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
  getAccountIdFromWalletAccountId: jest.fn(),
  resolveWalletApiSpendableBalance: jest.fn(),
  resolveWalletApiMaxSpendable: jest.fn(),
}));

jest.mock("./logic", () => ({
  ...jest.requireActual("./logic"),
  accountGetPublicKeyLogic: jest.fn(),
}));

jest.mock("../hw/signMessage/index", () => ({
  ...jest.requireActual("../hw/signMessage/index"),
  prepareMessageToSign: jest.fn(async (_account: unknown, message: string) => ({ message })),
}));

jest.mock("../hw/openTransportAsSubject", () => ({
  __esModule: true,
  default: jest.fn(),
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

jest.mock("../currencies", () => ({
  listSupportedCurrencies: jest.fn().mockReturnValue([]),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { useWalletAPIServer, TOKEN_LOOKUP_CONCURRENCY } = require("./react");

function getRegisteredHandler<Name extends keyof WalletHandlers>(name: Name): WalletHandlers[Name] {
  const calls = mockSetHandler.mock.calls.filter(([handlerName]) => handlerName === name);
  return calls[calls.length - 1]?.[1];
}

function createDefaultOptions(
  overrides?: Partial<useWalletAPIServerOptions>,
): useWalletAPIServerOptions {
  const tracking = createMockTracking();
  return {
    accountNames: walletState,
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
    },
    bridgeSession: new BridgeSession("https://test.app", jest.fn()),
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
    expect(result.current).toHaveProperty("onLoad");
    expect(result.current).toHaveProperty("onReload");
    expect(result.current).toHaveProperty("onLoadError");
    expect(result.current).toHaveProperty("widgetLoaded");

    expect(typeof result.current.onLoad).toBe("function");
    expect(typeof result.current.onReload).toBe("function");
    expect(typeof result.current.onLoadError).toBe("function");
  });

  it("serves the bridge session it is given", () => {
    const options = createDefaultOptions();
    renderHook(() => useWalletAPIServer(options));

    expect(WalletAPIServer).toHaveBeenCalledTimes(1);
    expect(jest.mocked(WalletAPIServer).mock.calls[0][0]).toBe(options.bridgeSession);
  });

  it("delivers the session messages once the server handlers are registered", async () => {
    const options = createDefaultOptions();
    let handlersAtDelivery = 0;
    options.bridgeSession.deliver(() => {
      handlersAtDelivery = mockSetHandler.mock.calls.length;
    });

    renderHook(() => useWalletAPIServer(options));
    await act(async () => {});

    expect(handlersAtDelivery).toBeGreaterThan(0);
    expect(handlersAtDelivery).toBe(mockSetHandler.mock.calls.length);
  });

  it("delivers them after the effects of the hooks the host calls next (e.g. a dapp transport)", async () => {
    const options = createDefaultOptions();
    let isNextHookReady = false;
    let wasReadyAtDelivery: boolean | undefined;
    options.bridgeSession.deliver(() => {
      wasReadyAtDelivery = isNextHookReady;
    });

    renderHook(() => {
      useWalletAPIServer(options);
      useEffect(() => {
        isNextHookReady = true;
      }, []);
    });
    await act(async () => {});

    expect(wasReadyAtDelivery).toBe(true);
  });

  it("keeps the device transport of the session when the manifest is updated", () => {
    jest.mocked(openTransportAsSubject).mockClear();
    const complete = jest.fn();
    jest
      .mocked(openTransportAsSubject)
      .mockReturnValue({ subscribe: jest.fn(), complete } as unknown as ReturnType<
        typeof openTransportAsSubject
      >);
    let onDeviceConnected: (result: unknown) => void = () => {};
    const uiDeviceTransport = jest.fn(({ onSuccess }) => {
      onDeviceConnected = onSuccess;
    });
    const options = createDefaultOptions({ uiHook: { "device.transport": uiDeviceTransport } });
    const { rerender } = renderHook(
      (props: useWalletAPIServerOptions) => useWalletAPIServer(props),
      { initialProps: options },
    );
    void getRegisteredHandler("device.transport")({ appName: "Ethereum" });
    onDeviceConnected({ device: { deviceId: "device", modelId: "nanoX" } });
    expect(openTransportAsSubject).toHaveBeenCalledTimes(1);

    rerender({ ...options, manifest: { ...options.manifest, name: "Renamed" } });
    expect(complete).not.toHaveBeenCalled();

    rerender({ ...options, bridgeSession: new BridgeSession("https://other.test.app", jest.fn()) });
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it("runs a new server, with its handlers, config and permissions, for each bridge session", () => {
    const options = createDefaultOptions();
    const { rerender, result } = renderHook(
      (props: useWalletAPIServerOptions) => useWalletAPIServer(props),
      { initialProps: options },
    );
    const firstServer = result.current.server;
    const handlersPerServer = mockSetHandler.mock.calls.length;
    const nextSession = new BridgeSession("https://other.test.app", jest.fn());

    rerender({ ...options, bridgeSession: nextSession });

    expect(result.current.server).not.toBe(firstServer);
    expect(jest.mocked(WalletAPIServer).mock.calls[1][0]).toBe(nextSession);
    expect(mockSetHandler.mock.calls.length).toBe(2 * handlersPerServer);
    expect(mockSetConfig).toHaveBeenCalledTimes(2);
    expect(mockSetPermissions).toHaveBeenCalledTimes(2);
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

  it("does not track load again when the same live app manifest is replaced", () => {
    const options = createDefaultOptions();
    const { rerender } = renderHook(
      (props: useWalletAPIServerOptions) => useWalletAPIServer(props),
      { initialProps: options },
    );

    expect(options.tracking.load).toHaveBeenCalledTimes(1);

    rerender({
      ...options,
      manifest: { ...options.manifest, name: "Renamed App" },
    });

    expect(options.tracking.load).toHaveBeenCalledTimes(1);
  });

  it("tracks load when the live app id changes", () => {
    const options = createDefaultOptions();
    const { rerender } = renderHook(
      (props: useWalletAPIServerOptions) => useWalletAPIServer(props),
      { initialProps: options },
    );

    rerender({
      ...options,
      manifest: { ...options.manifest, id: "other-app" },
    });

    expect(options.tracking.load).toHaveBeenCalledTimes(2);
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

describe("account.list handler", () => {
  const getHandler = () => getRegisteredHandler("account.list");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("resolves accounts with the spendableBalance from resolveWalletApiSpendableBalance", async () => {
    const account = createFixtureAccount("01");
    const spendableBalance = new BigNumber(999);
    const options = createDefaultOptions({ accounts: [account] });

    jest.mocked(resolveWalletApiSpendableBalance).mockResolvedValue(spendableBalance);

    renderHook(() => useWalletAPIServer(options));
    const result = await getHandler()({});

    expect(result).toEqual([expect.objectContaining({ spendableBalance })]);
    expect(resolveWalletApiSpendableBalance).toHaveBeenCalledTimes(1);
    expect(resolveWalletApiSpendableBalance).toHaveBeenCalledWith(account, account);
    expect(resolveWalletApiMaxSpendable).not.toHaveBeenCalled();
  });
});

describe("currency.list handler — token lookup concurrency", () => {
  const getHandler = () => getRegisteredHandler("currency.list");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  /**
   * Regression for QAA-1497. The handler used to resolve every requested token id in a
   * single unbounded `Promise.all`. Measured against the real CAL API with the ids the
   * Buy screen asks for, that took 75.6s and 251 of the requests failed outright;
   * bounding the pool took 5.9s with none failing. A failed lookup resolves to null and
   * is silently dropped, so the unbounded version also returned an incomplete list.
   * This pins the bound so a future refactor cannot quietly restore the fan-out.
   */
  it("never has more than TOKEN_LOOKUP_CONCURRENCY lookups in flight", async () => {
    const tokenIds = Array.from(
      { length: TOKEN_LOOKUP_CONCURRENCY * 8 },
      (_, i) => `ethereum/erc20/token_${i}`,
    );
    let inFlight = 0;
    let peakInFlight = 0;

    const findTokenById = jest.fn(async () => {
      inFlight += 1;
      peakInFlight = Math.max(peakInFlight, inFlight);
      await new Promise(resolve => setTimeout(resolve, 0));
      inFlight -= 1;
      return null;
    });
    jest.mocked(getCryptoAssetsStore).mockReturnValue({ findTokenById } as never);

    renderHook(() => useWalletAPIServer(createDefaultOptions()));
    await getHandler()({ currencyIds: tokenIds });

    expect(findTokenById).toHaveBeenCalledTimes(tokenIds.length);
    expect(peakInFlight).toBeGreaterThan(1);
    expect(peakInFlight).toBeLessThanOrEqual(TOKEN_LOOKUP_CONCURRENCY);
  });

  it("should omit failed token lookups instead of rejecting currency.list", async () => {
    jest.mocked(getCryptoAssetsStore).mockReturnValue({
      findTokenById: jest.fn().mockRejectedValue(new Error("bad json")),
    } as never);

    renderHook(() => useWalletAPIServer(createDefaultOptions()));

    await expect(getHandler()({ currencyIds: ["ethereum/erc20/usd__coin"] })).resolves.toEqual([]);
  });
});

describe("account.request handler", () => {
  const getHandler = () => getRegisteredHandler("account.request");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("resolves with the spendableBalance from resolveWalletApiSpendableBalance", async () => {
    const account = createFixtureAccount("01");
    const spendableBalance = new BigNumber(777);

    jest.mocked(resolveWalletApiSpendableBalance).mockResolvedValue(spendableBalance);
    const uiAccountRequest = jest.fn(({ onSuccess }) => {
      onSuccess(account, undefined);
    });

    const options = createDefaultOptions({
      accounts: [account],
      uiHook: { "account.request": uiAccountRequest },
    });

    renderHook(() => useWalletAPIServer(options));
    const result = await getHandler()({});

    expect(result).toEqual(expect.objectContaining({ spendableBalance }));
    expect(resolveWalletApiSpendableBalance).toHaveBeenCalledTimes(1);
    expect(resolveWalletApiSpendableBalance).toHaveBeenCalledWith(account, undefined);
    expect(resolveWalletApiMaxSpendable).not.toHaveBeenCalled();
  });
});

describe("UI flows of a closed bridge session", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("does not open a UI flow once the session is closed", () => {
    const uiAccountRequest = jest.fn();
    const options = createDefaultOptions({ uiHook: { "account.request": uiAccountRequest } });
    renderHook(() => useWalletAPIServer(options));

    options.bridgeSession.close();
    void getRegisteredHandler("account.request")({});

    expect(uiAccountRequest).not.toHaveBeenCalled();
  });

  it("does not open the device for a connection that completes after the session is closed", () => {
    let onDeviceConnected: (result: unknown) => void = () => {};
    const uiDeviceTransport = jest.fn(({ onSuccess }) => {
      onDeviceConnected = onSuccess;
    });
    const options = createDefaultOptions({ uiHook: { "device.transport": uiDeviceTransport } });
    renderHook(() => useWalletAPIServer(options));

    void getRegisteredHandler("device.transport")({ appName: "Ethereum" });
    options.bridgeSession.close();
    onDeviceConnected({ device: { deviceId: "device", modelId: "nanoX" } });

    expect(uiDeviceTransport).toHaveBeenCalledTimes(1);
    expect(openTransportAsSubject).not.toHaveBeenCalled();
  });
});

describe("signing flow of a closed bridge session", () => {
  afterEach(() => {
    cleanup();
    liveBlindSigningReporter.setContext({ liveAppContext: null });
  });

  it("rejects a signing flow left open and restores the signing attribution", async () => {
    const account = createFixtureAccount("01");
    jest.mocked(getAccountIdFromWalletAccountId).mockReturnValue(account.id);
    const uiMessageSign = jest.fn();
    const options = createDefaultOptions({
      accounts: [account],
      uiHook: { "message.sign": uiMessageSign },
    });
    renderHook(() => useWalletAPIServer(options));

    const request = getRegisteredHandler("message.sign")({
      accountId: "wallet-account-id",
      message: Buffer.from("hello"),
      meta: undefined,
    });
    await waitFor(() => expect(uiMessageSign).toHaveBeenCalled());
    expect(liveBlindSigningReporter.getContext().liveAppContext).toBe("test-app");

    options.bridgeSession.close();

    await expect(request).rejects.toBeInstanceOf(BridgeSessionClosed);
    expect(liveBlindSigningReporter.getContext().liveAppContext).toBeNull();
  });
});

describe("account.getMaxSpendable handler", () => {
  const getHandler = () => {
    const call = mockSetHandler.mock.calls.find(([name]) => name === "account.getMaxSpendable");
    if (!call) {
      throw new Error("account.getMaxSpendable was not registered");
    }
    return call[1] as (params: { accountId: string }) => Promise<string>;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("returns the estimate for the requested account", async () => {
    const account = createFixtureAccount("01");
    const maxSpendable = new BigNumber(800);
    jest.mocked(getAccountIdFromWalletAccountId).mockReturnValue(account.id);
    jest.mocked(resolveWalletApiMaxSpendable).mockResolvedValue(maxSpendable);

    renderHook(() => useWalletAPIServer(createDefaultOptions({ accounts: [account] })));

    await expect(getHandler()({ accountId: "wallet-account-id" })).resolves.toBe("800");
    expect(resolveWalletApiMaxSpendable).toHaveBeenCalledWith(account, account);
  });

  it("serializes a large estimate as a decimal integer string", async () => {
    const account = createFixtureAccount("01");
    const maxSpendable = new BigNumber("1e+21");
    jest.mocked(getAccountIdFromWalletAccountId).mockReturnValue(account.id);
    jest.mocked(resolveWalletApiMaxSpendable).mockResolvedValue(maxSpendable);

    renderHook(() => useWalletAPIServer(createDefaultOptions({ accounts: [account] })));

    expect(maxSpendable.toString()).toBe("1e+21");
    await expect(getHandler()({ accountId: "wallet-account-id" })).resolves.toBe(
      "1000000000000000000000",
    );
  });

  it("rejects when the estimate cannot be computed", async () => {
    const account = createFixtureAccount("01");
    jest.mocked(getAccountIdFromWalletAccountId).mockReturnValue(account.id);
    jest.mocked(resolveWalletApiMaxSpendable).mockResolvedValue(undefined);

    renderHook(() => useWalletAPIServer(createDefaultOptions({ accounts: [account] })));

    await expect(getHandler()({ accountId: "wallet-account-id" })).rejects.toThrow(
      "account.getMaxSpendable failed",
    );
  });

  it("rejects when the wallet account id is unknown", async () => {
    jest.mocked(getAccountIdFromWalletAccountId).mockReturnValue(undefined);

    renderHook(() => useWalletAPIServer(createDefaultOptions()));

    await expect(getHandler()({ accountId: "missing" })).rejects.toThrow(
      "accountId missing unknown",
    );
  });
});

describe("account.getPublicKey handler", () => {
  const getHandler = () => getRegisteredHandler("account.getPublicKey");

  beforeEach(() => {
    jest.clearAllMocks();
  });
  afterEach(() => cleanup());

  it("fires the account.publicKeyUnavailable uiHook and still rejects when the key is unavailable", async () => {
    const account = createFixtureAccount("01");
    const uiPublicKeyUnavailable = jest.fn();
    const options = createDefaultOptions({
      accounts: [account],
      uiHook: { "account.publicKeyUnavailable": uiPublicKeyUnavailable },
    });
    (accountGetPublicKeyLogic as jest.Mock).mockRejectedValueOnce(
      new AccountPublicKeyUnavailable(),
    );
    (getAccountIdFromWalletAccountId as jest.Mock).mockReturnValueOnce(account.id);

    renderHook(() => useWalletAPIServer(options));

    await expect(getHandler()({ accountId: "wallet-account-id" })).rejects.toBeInstanceOf(
      AccountPublicKeyUnavailable,
    );
    expect(uiPublicKeyUnavailable).toHaveBeenCalledTimes(1);
    expect(uiPublicKeyUnavailable).toHaveBeenCalledWith({ account, parentAccount: undefined });
  });

  it("fires the uiHook when a serialized error carries the name but lost its prototype", async () => {
    const account = createFixtureAccount("01");
    const uiPublicKeyUnavailable = jest.fn();
    const options = createDefaultOptions({
      accounts: [account],
      uiHook: { "account.publicKeyUnavailable": uiPublicKeyUnavailable },
    });
    (accountGetPublicKeyLogic as jest.Mock).mockRejectedValueOnce({
      name: "AccountPublicKeyUnavailable",
    });
    (getAccountIdFromWalletAccountId as jest.Mock).mockReturnValueOnce(account.id);

    renderHook(() => useWalletAPIServer(options));

    await expect(getHandler()({ accountId: "wallet-account-id" })).rejects.toEqual({
      name: "AccountPublicKeyUnavailable",
    });
    expect(uiPublicKeyUnavailable).toHaveBeenCalledTimes(1);
  });

  it("still rejects with the original error when the uiHook itself throws", async () => {
    const account = createFixtureAccount("01");
    const uiPublicKeyUnavailable = jest.fn(() => {
      throw new Error("ui render failure");
    });
    const options = createDefaultOptions({
      accounts: [account],
      uiHook: { "account.publicKeyUnavailable": uiPublicKeyUnavailable },
    });
    (accountGetPublicKeyLogic as jest.Mock).mockRejectedValueOnce(
      new AccountPublicKeyUnavailable(),
    );
    (getAccountIdFromWalletAccountId as jest.Mock).mockReturnValueOnce(account.id);

    renderHook(() => useWalletAPIServer(options));

    await expect(getHandler()({ accountId: "wallet-account-id" })).rejects.toBeInstanceOf(
      AccountPublicKeyUnavailable,
    );
    expect(uiPublicKeyUnavailable).toHaveBeenCalledTimes(1);
  });

  it("does not fire the uiHook for unrelated errors but still rejects", async () => {
    const uiPublicKeyUnavailable = jest.fn();
    const options = createDefaultOptions({
      uiHook: { "account.publicKeyUnavailable": uiPublicKeyUnavailable },
    });
    (accountGetPublicKeyLogic as jest.Mock).mockRejectedValueOnce(new Error("account not found"));

    renderHook(() => useWalletAPIServer(options));

    await expect(getHandler()({ accountId: "x" })).rejects.toThrow("account not found");
    expect(uiPublicKeyUnavailable).not.toHaveBeenCalled();
  });

  it("resolves with the public key on success", async () => {
    const options = createDefaultOptions();
    (accountGetPublicKeyLogic as jest.Mock).mockResolvedValueOnce("edpkTestKey");

    renderHook(() => useWalletAPIServer(options));

    await expect(getHandler()({ accountId: "x" })).resolves.toBe("edpkTestKey");
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

describe("useDappSessionUiHook", () => {
  const setup = () => {
    const session = new BridgeSession("https://app.example.com", jest.fn());
    const uiHook = {
      "account.request": jest.fn(),
      "message.sign": jest.fn(),
      "transaction.sign": jest.fn(),
      "transaction.broadcast": jest.fn(),
    } as unknown as UiHook;
    const { result } = renderHook(() => useDappSessionUiHook(session, uiHook));
    return { session, uiHook, dappUiHook: result.current };
  };

  it("opens the signing UI while the session of the request is open", () => {
    const { uiHook, dappUiHook } = setup();
    const onSuccess = jest.fn();

    dappUiHook["message.sign"]({ onSuccess } as never);
    jest.mocked(uiHook["message.sign"]).mock.calls[0][0].onSuccess("0xsignature");

    expect(onSuccess).toHaveBeenCalledWith("0xsignature");
  });

  it("opens no signing UI once the session closed while the request was prepared", () => {
    const { session, uiHook, dappUiHook } = setup();

    session.close();
    dappUiHook["message.sign"]({ onSuccess: jest.fn() } as never);
    dappUiHook["transaction.sign"]({ onSuccess: jest.fn() } as never);
    dappUiHook["account.request"]({ onSuccess: jest.fn() } as never);

    expect(uiHook["message.sign"]).not.toHaveBeenCalled();
    expect(uiHook["transaction.sign"]).not.toHaveBeenCalled();
    expect(uiHook["account.request"]).not.toHaveBeenCalled();
  });

  it("drops the callbacks of a signing UI that completes after the session closed", () => {
    const { session, uiHook, dappUiHook } = setup();
    const onSuccess = jest.fn();

    dappUiHook["transaction.sign"]({ onSuccess } as never);
    session.close();
    jest.mocked(uiHook["transaction.sign"]).mock.calls[0][0].onSuccess({} as never);

    expect(onSuccess).not.toHaveBeenCalled();
  });
});
