import React from "react";
import { setupScanDeviceTests } from "./shared";
import { setSyncScanObservable } from "./syncBridgeHooks";
import BigNumber from "bignumber.js";
import { concat, NEVER, of, throwError } from "rxjs";
import { DdRum } from "@datadog/mobile-react-native";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import type { Account } from "@ledgerhq/types-live";
import { act, renderHook, waitFor } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import { prepareCurrency } from "~/bridge/cache";
import { isOperationActive, setOperationSink } from "@shared/observability-operations";
import { ADD_ACCOUNT_OPERATION } from "LLM/features/Accounts/constants";
import { datadogOperationSink } from "~/datadogOperationSink";
import useScanDeviceAccountsViewModel from "../useScanDeviceAccountsViewModel";

jest.mock("@datadog/mobile-react-native", () => require("@tests/mocks/datadogMobileReactNative"));
jest.mock("~/datadog", () => ({ isDatadogRecording: () => true }));

jest.mock(
  "@ledgerhq/live-common/bridge/useCurrencyBridge",
  () => require("./syncBridgeHooks").currencyBridgeHook,
);
jest.mock(
  "@ledgerhq/live-common/bridge/useAccountBridge",
  () => require("./syncBridgeHooks").accountBridgeHook,
);

const {
  replace,
  navigate,
  goBack,
  pop,
  setRouteParams,
  makeDiscoveredEvent,
  resetSpies,
  createAccount: createEmptyAccount,
} = setupScanDeviceTests();

const setScanObservable = setSyncScanObservable;

const startFeatureOperation = jest.mocked(DdRum.startFeatureOperation);
const succeedFeatureOperation = jest.mocked(DdRum.succeedFeatureOperation);
const failFeatureOperation = jest.mocked(DdRum.failFeatureOperation);

const createFundedAccount = (overrides?: Partial<Account>) =>
  createEmptyAccount({ balance: new BigNumber(1000), used: true, ...overrides });

const NO_EXISTING_ACCOUNTS: Account[] = [];
const NO_BLACKLISTED_TOKENS: string[] = [];

const renderScan = (existingAccounts: Account[] = NO_EXISTING_ACCOUNTS) =>
  renderHook(() =>
    useScanDeviceAccountsViewModel({
      existingAccounts,
      blacklistedTokenIds: NO_BLACKLISTED_TOKENS,
      analyticsMetadata: {},
    }),
  );

const renderReopenableScan = () => {
  let screenInstance = 0;
  const ScreenInstance = ({ children }: { children?: React.ReactNode }) =>
    React.createElement(React.Fragment, { key: screenInstance }, children);
  const rendered = renderHook(
    () =>
      useScanDeviceAccountsViewModel({
        existingAccounts: NO_EXISTING_ACCOUNTS,
        blacklistedTokenIds: NO_BLACKLISTED_TOKENS,
        analyticsMetadata: {},
      }),
    { innerWrapper: ScreenInstance },
  );
  const reopenScan = () => {
    screenInstance += 1;
    rendered.rerender({});
  };
  return { ...rendered, reopenScan };
};

const lastCallAttributes = (sdkMethod: { mock: { calls: unknown[][] } }) =>
  sdkMethod.mock.calls.at(-1)?.at(-1);

describe("useScanDeviceAccountsViewModel add_account RUM operation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetSpies();
    setOperationSink(datadogOperationSink);
    (prepareCurrency as jest.Mock).mockResolvedValue(undefined);
    setRouteParams("ethereum", "device-1", { context: "addAccounts" });
    setScanObservable(of(makeDiscoveredEvent(createFundedAccount())));
  });

  it("should start the operation with the flow attributes when the scan starts", async () => {
    const { result } = renderScan();
    await waitFor(() => expect(result.current.scanning).toBe(false));

    expect(startFeatureOperation).toHaveBeenCalledTimes(1);
    expect(startFeatureOperation.mock.calls[0]).toStrictEqual([
      "add_account",
      null,
      {
        currency_id: "ethereum",
        currency_family: "evm",
        is_token: false,
        inline: false,
        context: "addAccounts",
        attempt: 1,
      },
    ]);
  });

  it("should start the operation with the device model and the transport", async () => {
    setRouteParams("ethereum", "device-1", {
      device: { deviceId: "device-1", deviceName: "My Nano", modelId: "nanoX", wired: false },
    });

    const { result } = renderScan();
    await waitFor(() => expect(result.current.scanning).toBe(false));

    const startAttributes = lastCallAttributes(startFeatureOperation);
    expect(startAttributes).toMatchObject({ device_model_id: "nanoX", transport: "ble" });
    expect(JSON.stringify(startAttributes)).not.toContain("My Nano");
  });

  it("should send the usb transport for a wired device", async () => {
    setRouteParams("ethereum", "device-1", {
      device: { deviceId: "device-1", modelId: "stax", wired: true },
    });

    const { result } = renderScan();
    await waitFor(() => expect(result.current.scanning).toBe(false));

    expect(lastCallAttributes(startFeatureOperation)).toMatchObject({
      device_model_id: "stax",
      transport: "usb",
    });
  });

  it("should send the scanned parent chain when adding a token", async () => {
    setRouteParams("ethereum", "device-1", { currency: usdcToken });

    const { result } = renderScan();
    await waitFor(() => expect(result.current.scanning).toBe(false));

    expect(lastCallAttributes(startFeatureOperation)).toMatchObject({
      currency_id: "ethereum",
      currency_family: "evm",
      is_token: true,
    });
  });

  it("should succeed with the number of added accounts before replacing with the success screen", async () => {
    const { result } = renderScan();
    await waitFor(() => expect(result.current.scannedAccounts).toHaveLength(1));
    await waitFor(() => expect(result.current.scanning).toBe(false));

    act(() => result.current.importAccounts());

    expect(succeedFeatureOperation).toHaveBeenCalledTimes(1);
    expect(succeedFeatureOperation).toHaveBeenCalledWith("add_account", null, {
      currency_id: "ethereum",
      currency_family: "evm",
      is_token: false,
      inline: false,
      context: "addAccounts",
      attempt: 1,
      step: "selecting",
      accounts_scanned: 1,
      accounts_added: 1,
    });
    expect(replace).toHaveBeenCalledWith(ScreenName.AddAccountsSuccess, expect.anything());
    expect(succeedFeatureOperation.mock.invocationCallOrder[0]).toBeLessThan(
      replace.mock.invocationCallOrder[0],
    );
    expect(failFeatureOperation).not.toHaveBeenCalled();
  });

  it("should succeed before popping the screens of an inline flow", async () => {
    const onSuccess = jest.fn();
    setRouteParams("ethereum", "device-1", { inline: true, onSuccess });

    const { result, unmount } = renderScan();
    await waitFor(() => expect(result.current.scannedAccounts).toHaveLength(1));
    await waitFor(() => expect(result.current.scanning).toBe(false));

    act(() => result.current.importAccounts());
    unmount();

    expect(lastCallAttributes(succeedFeatureOperation)).toMatchObject({
      inline: true,
      accounts_added: 1,
    });
    expect(succeedFeatureOperation.mock.invocationCallOrder[0]).toBeLessThan(
      pop.mock.invocationCallOrder[0],
    );
    expect(onSuccess).toHaveBeenCalled();
    expect(failFeatureOperation).not.toHaveBeenCalled();
  });

  it("should fail with ERROR and the error name when the scan fails", async () => {
    (prepareCurrency as jest.Mock).mockRejectedValueOnce(new TypeError("scan failed"));

    const { result } = renderScan();
    await waitFor(() => expect(result.current.error).not.toBeNull());

    expect(failFeatureOperation).toHaveBeenCalledTimes(1);
    expect(failFeatureOperation.mock.calls[0].slice(0, 3)).toEqual(["add_account", null, "ERROR"]);
    expect(lastCallAttributes(failFeatureOperation)).toMatchObject({
      error_name: "TypeError",
      step: "preparing",
      accounts_scanned: 0,
    });
  });

  it("should fail in the scanning step with the status of the explorer error a scan error wraps", async () => {
    const explorerError = Object.assign(new Error("API HTTP 503"), {
      name: "LedgerAPI5xx",
      status: 503,
    });
    const scanError = Object.assign(new Error("balance failed", { cause: explorerError }), {
      name: "UnexpectedGetBalanceError",
    });
    setScanObservable(throwError(() => scanError));

    const { result } = renderScan();
    await waitFor(() => expect(result.current.error).not.toBeNull());

    expect(lastCallAttributes(failFeatureOperation)).toMatchObject({
      error_name: "UnexpectedGetBalanceError",
      error_cause_name: "LedgerAPI5xx",
      error_http_status: 503,
      step: "scanning",
    });
  });

  it("should count an account discovered right before the scan fails", async () => {
    setScanObservable(
      concat(
        of(makeDiscoveredEvent(createFundedAccount())),
        throwError(() => new Error("scan failed")),
      ),
    );

    const { result } = renderScan();
    await waitFor(() => expect(result.current.error).not.toBeNull());

    expect(lastCallAttributes(failFeatureOperation)).toMatchObject({
      step: "scanning",
      accounts_scanned: 1,
    });
  });

  it("should fail with the device status code when the device rejects the scan", async () => {
    const deviceError = Object.assign(new Error("Ledger device: Locked device (0x5515)"), {
      name: "TransportStatusError",
      statusCode: 0x5515,
    });
    (prepareCurrency as jest.Mock).mockRejectedValueOnce(deviceError);

    const { result } = renderScan();
    await waitFor(() => expect(result.current.error).not.toBeNull());

    expect(lastCallAttributes(failFeatureOperation)).toMatchObject({
      error_name: "TransportStatusError",
      error_apdu_status: "0x5515",
    });
  });

  it("should fail with the http status and the shape of an explorer error message, never its url", async () => {
    const url = "https://explorers.api.live.ledger.com/blockchain/v4/eth/address/0xsecret";
    const explorerError = Object.assign(new Error(`API HTTP 503 ${url}`), {
      name: "LedgerAPI5xx",
      status: 503,
      url,
    });
    (prepareCurrency as jest.Mock).mockRejectedValueOnce(explorerError);

    const { result } = renderScan();
    await waitFor(() => expect(result.current.error).not.toBeNull());

    const failAttributes = lastCallAttributes(failFeatureOperation);
    expect(failAttributes).toMatchObject({
      error_name: "LedgerAPI5xx",
      error_message: "API HTTP [n] [id]",
      error_http_status: 503,
    });
    expect(JSON.stringify(failAttributes)).not.toContain("0xsecret");
  });

  it("should succeed with the region_restricted outcome when the currency is region restricted", async () => {
    const regionRestricted = new Error("restricted");
    regionRestricted.name = "CurrencyRegionRestrictedError";
    (prepareCurrency as jest.Mock).mockRejectedValueOnce(regionRestricted);
    setRouteParams("ethereum", "device-1", { inline: true, onCloseNavigation: jest.fn() });

    renderScan();
    await waitFor(() => expect(succeedFeatureOperation).toHaveBeenCalledTimes(1));

    expect(lastCallAttributes(succeedFeatureOperation)).toMatchObject({
      outcome: "region_restricted",
    });
    expect(failFeatureOperation).not.toHaveBeenCalled();
  });

  it("should start a new attempt when retrying after a scan error", async () => {
    (prepareCurrency as jest.Mock).mockRejectedValueOnce(new Error("scan failed"));

    const { result } = renderScan();
    await waitFor(() => expect(result.current.error).not.toBeNull());

    act(() => result.current.handleRetry());
    await waitFor(() => expect(result.current.scanning).toBe(false));

    expect(startFeatureOperation).toHaveBeenCalledTimes(2);
    expect(lastCallAttributes(startFeatureOperation)).toMatchObject({ attempt: 2 });
    expect(isOperationActive(ADD_ACCOUNT_OPERATION)).toBe(true);
  });

  it("should abandon a retried attempt with its own progress when it is left while preparing", async () => {
    setScanObservable(NEVER);
    (prepareCurrency as jest.Mock).mockRejectedValueOnce(new Error("scan failed"));
    const { result, unmount } = renderScan();
    await waitFor(() => expect(result.current.error).not.toBeNull());

    (prepareCurrency as jest.Mock).mockReturnValue(new Promise(() => {}));
    act(() => result.current.handleRetry());
    unmount();

    expect(failFeatureOperation).toHaveBeenCalledTimes(2);
    expect(failFeatureOperation.mock.calls[1][2]).toBe("ABANDONED");
    expect(lastCallAttributes(failFeatureOperation)).toMatchObject({
      attempt: 2,
      step: "preparing",
      accounts_scanned: 0,
    });
  });

  it("should keep the active operation when the scan restarts without an error", async () => {
    const { result } = renderScan();
    await waitFor(() => expect(result.current.scanning).toBe(false));

    act(() => result.current.handleRetry());
    await waitFor(() => expect(result.current.scanning).toBe(false));

    expect(startFeatureOperation).toHaveBeenCalledTimes(1);
    expect(failFeatureOperation).not.toHaveBeenCalled();
  });

  it("should not start a new operation when the scan effect re-runs after the operation ended", async () => {
    let blacklistedTokenIds = NO_BLACKLISTED_TOKENS;
    const { result, rerender } = renderHook(() =>
      useScanDeviceAccountsViewModel({
        existingAccounts: NO_EXISTING_ACCOUNTS,
        blacklistedTokenIds,
        analyticsMetadata: {},
      }),
    );
    await waitFor(() => expect(result.current.scanning).toBe(false));
    act(() => result.current.quitFlow());
    const prepareCallsBeforeRerun = jest.mocked(prepareCurrency).mock.calls.length;

    blacklistedTokenIds = ["ethereum/erc20/spam"];
    rerender({});
    await waitFor(() =>
      expect(jest.mocked(prepareCurrency).mock.calls.length).toBeGreaterThan(
        prepareCallsBeforeRerun,
      ),
    );

    expect(startFeatureOperation).toHaveBeenCalledTimes(1);
    expect(isOperationActive(ADD_ACCOUNT_OPERATION)).toBe(false);
  });

  it("should not start a new operation when the start attributes change after the operation ended", async () => {
    const { result, rerender } = renderScan();
    await waitFor(() => expect(result.current.scanning).toBe(false));
    act(() => result.current.quitFlow());

    setRouteParams("ethereum", "device-1", { context: "receiveFunds" });
    rerender({});
    await waitFor(() => expect(result.current.scanning).toBe(false));

    expect(startFeatureOperation).toHaveBeenCalledTimes(1);
    expect(isOperationActive(ADD_ACCOUNT_OPERATION)).toBe(false);
  });

  it("should go on counting attempts when an inline retry reopens the scan from device selection", async () => {
    setRouteParams("ethereum", "device-1", { inline: true, openedFromRouteKey: "SelectDevice-1" });
    (prepareCurrency as jest.Mock).mockRejectedValueOnce(new Error("scan failed"));

    const { result, reopenScan } = renderReopenableScan();
    await waitFor(() => expect(result.current.error).not.toBeNull());
    act(() => result.current.handleRetry());
    expect(goBack).toHaveBeenCalledTimes(1);
    expect(startFeatureOperation).toHaveBeenCalledTimes(1);

    reopenScan();
    await waitFor(() => expect(result.current.scanning).toBe(false));

    expect(startFeatureOperation).toHaveBeenCalledTimes(2);
    expect(lastCallAttributes(startFeatureOperation)).toMatchObject({ inline: true, attempt: 2 });
    expect(failFeatureOperation).toHaveBeenCalledTimes(1);
    expect(failFeatureOperation.mock.calls[0][2]).toBe("ERROR");
  });

  it("should start again at attempt 1 when a new journey opens after an inline retry was left", async () => {
    setRouteParams("ethereum", "device-1", { inline: true, openedFromRouteKey: "SelectDevice-1" });
    (prepareCurrency as jest.Mock).mockRejectedValueOnce(new Error("scan failed"));

    const { result, reopenScan } = renderReopenableScan();
    await waitFor(() => expect(result.current.error).not.toBeNull());
    act(() => result.current.handleRetry());

    setRouteParams("ethereum", "device-1", { inline: true, openedFromRouteKey: "SelectDevice-2" });
    reopenScan();
    await waitFor(() => expect(result.current.scanning).toBe(false));

    expect(startFeatureOperation).toHaveBeenCalledTimes(2);
    expect(lastCallAttributes(startFeatureOperation)).toMatchObject({ inline: true, attempt: 1 });
  });

  it("should start again at attempt 1 after an inline retry when no device selection opened the scan", async () => {
    setRouteParams("ethereum", "device-1", { inline: true });
    (prepareCurrency as jest.Mock).mockRejectedValueOnce(new Error("scan failed"));

    const { result, reopenScan } = renderReopenableScan();
    await waitFor(() => expect(result.current.error).not.toBeNull());
    act(() => result.current.handleRetry());

    reopenScan();
    await waitFor(() => expect(result.current.scanning).toBe(false));

    expect(startFeatureOperation).toHaveBeenCalledTimes(2);
    expect(lastCallAttributes(startFeatureOperation)).toMatchObject({ inline: true, attempt: 1 });
  });

  it("should start again at attempt 1 when an inline scan error is closed instead of retried", async () => {
    setRouteParams("ethereum", "device-1", {
      inline: true,
      onCloseNavigation: jest.fn(),
      openedFromRouteKey: "SelectDevice-1",
    });
    (prepareCurrency as jest.Mock).mockRejectedValueOnce(new Error("scan failed"));

    const { result, reopenScan } = renderReopenableScan();
    await waitFor(() => expect(result.current.error).not.toBeNull());
    act(() => result.current.onCancel());
    act(() => result.current.onModalHide());

    reopenScan();
    await waitFor(() => expect(result.current.scanning).toBe(false));

    expect(startFeatureOperation).toHaveBeenCalledTimes(2);
    expect(lastCallAttributes(startFeatureOperation)).toMatchObject({ inline: true, attempt: 1 });
  });

  it("should succeed as a Canton onboarding hand-off before replacing the screen", async () => {
    setRouteParams("canton_network");
    const cantonAccount = {
      ...createFundedAccount({ id: "js:2:canton_network:party" }),
      cantonResources: { isOnboarded: false },
    } as Account;
    setScanObservable(of(makeDiscoveredEvent(cantonAccount)));

    const { result, unmount } = renderScan();
    await waitFor(() => expect(result.current.selectedIds).toEqual([cantonAccount.id]));
    act(() => result.current.importAccounts());
    unmount();

    expect(replace).toHaveBeenCalledWith(ScreenName.CantonOnboardAccount, expect.anything());
    expect(succeedFeatureOperation).toHaveBeenCalledTimes(1);
    expect(lastCallAttributes(succeedFeatureOperation)).toMatchObject({
      currency_id: "canton_network",
      handoff: "canton_onboarding",
      accounts_selected: 1,
    });
    expect(succeedFeatureOperation.mock.invocationCallOrder[0]).toBeLessThan(
      replace.mock.invocationCallOrder[0],
    );
    expect(failFeatureOperation).not.toHaveBeenCalled();
  });

  it("should succeed with the nothing_to_add outcome when the user quits with nothing to add", async () => {
    const { result } = renderScan();
    await waitFor(() => expect(result.current.scanning).toBe(false));

    act(() => result.current.quitFlow());

    expect(succeedFeatureOperation).toHaveBeenCalledTimes(1);
    expect(lastCallAttributes(succeedFeatureOperation)).toMatchObject({
      outcome: "nothing_to_add",
    });
    expect(failFeatureOperation).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalled();
  });

  it("should succeed with the already_empty_account outcome before opening the empty-account warning", async () => {
    setRouteParams("bitcoin");
    const emptyAccount = createFundedAccount({
      id: "js:2:bitcoin:xpub-native_segwit:native_segwit",
      derivationMode: "native_segwit",
      used: false,
      balance: new BigNumber(0),
    });
    setScanObservable(of(makeDiscoveredEvent(emptyAccount)));
    const existingAccounts = [emptyAccount];

    renderScan(existingAccounts);
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(ScreenName.AddAccountsWarning, expect.anything()),
    );

    expect(succeedFeatureOperation).toHaveBeenCalledTimes(1);
    expect(lastCallAttributes(succeedFeatureOperation)).toMatchObject({
      outcome: "already_empty_account",
      accounts_scanned: 1,
    });
    expect(failFeatureOperation).not.toHaveBeenCalled();
  });

  it("should succeed with the no_associated_accounts outcome before opening the no associated accounts screen", async () => {
    setRouteParams("hedera");
    const importedAccount = createFundedAccount({
      id: "js:hedera:0.0.12345:hederaBip44",
      used: true,
    });
    setScanObservable(of(makeDiscoveredEvent(importedAccount)));
    const existingAccounts = [importedAccount];

    renderScan(existingAccounts);
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(ScreenName.NoAssociatedAccounts, expect.anything()),
    );

    expect(succeedFeatureOperation).toHaveBeenCalledTimes(1);
    expect(lastCallAttributes(succeedFeatureOperation)).toMatchObject({
      outcome: "no_associated_accounts",
      accounts_scanned: 1,
    });
    expect(failFeatureOperation).not.toHaveBeenCalled();
  });

  it("should abandon the operation when the screen unmounts during the flow", async () => {
    const { result, unmount } = renderScan();
    await waitFor(() => expect(result.current.scanning).toBe(false));

    unmount();

    expect(failFeatureOperation).toHaveBeenCalledTimes(1);
    expect(failFeatureOperation.mock.calls[0][2]).toBe("ABANDONED");
    expect(lastCallAttributes(failFeatureOperation)).toMatchObject({
      trigger: "unmount",
      step: "selecting",
      accounts_scanned: 1,
    });
  });

  it("should abandon as preparing when the screen unmounts before the currency is prepared", async () => {
    (prepareCurrency as jest.Mock).mockReturnValue(new Promise(() => {}));
    const { unmount } = renderScan();
    await waitFor(() => expect(startFeatureOperation).toHaveBeenCalledTimes(1));

    unmount();

    expect(lastCallAttributes(failFeatureOperation)).toMatchObject({
      trigger: "unmount",
      step: "preparing",
      accounts_scanned: 0,
    });
  });

  it("should abandon as scanning when the screen unmounts before the scan completes", async () => {
    setScanObservable(concat(of(makeDiscoveredEvent(createFundedAccount())), NEVER));
    const { result, unmount } = renderScan();
    await waitFor(() => expect(result.current.scannedAccounts).toHaveLength(1));

    unmount();

    expect(lastCallAttributes(failFeatureOperation)).toMatchObject({
      trigger: "unmount",
      step: "scanning",
      accounts_scanned: 1,
    });
  });

  it("should tell the user stopped the scan when the flow is left afterwards", async () => {
    setScanObservable(concat(of(makeDiscoveredEvent(createFundedAccount())), NEVER));
    const { result, unmount } = renderScan();
    await waitFor(() => expect(result.current.scannedAccounts).toHaveLength(1));

    act(() => result.current.stopSubscription());
    unmount();

    expect(lastCallAttributes(failFeatureOperation)).toMatchObject({
      trigger: "unmount",
      step: "selecting",
      accounts_scanned: 1,
      scan_stopped_by_user: true,
    });
  });
});
