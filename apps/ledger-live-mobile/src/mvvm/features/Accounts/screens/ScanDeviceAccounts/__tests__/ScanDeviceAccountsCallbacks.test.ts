import { track } from "@shared/analytics";
import { setupScanDeviceTests } from "./shared";
import { setSyncScanObservable } from "./syncBridgeHooks";
import BigNumber from "bignumber.js";
import { Observable, of } from "rxjs";
import type { Account } from "@ledgerhq/types-live";
import { act, renderHook, waitFor } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import { prepareCurrency } from "~/bridge/cache";
import type { AnalyticMetadata } from "LLM/hooks/useAnalytics/types";
import useScanDeviceAccountsViewModel from "../useScanDeviceAccountsViewModel";

// Synchronous bridge hooks, so scanning resolves within each test.
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

const createAccount = (overrides?: Partial<Account>) =>
  createEmptyAccount({ balance: new BigNumber(1000), used: true, ...overrides });

const analyticsMetadata: AnalyticMetadata = {
  ScanDeviceAccounts: {
    onStopScan: { eventName: "stop_scan", payload: { flow: "addAccount" } },
    onBack: { eventName: "back", payload: {} },
  },
  AccountsFound: {
    onSelectAll: { eventName: "select_all", payload: {} },
    onContinue: { eventName: "continue", payload: {} },
    onAccountsAdded: { eventName: "accounts_added", payload: {} },
  },
};

// Stable references: the hook memoizes `startSubscription` on these props, so passing
// fresh array literals every render would restart the scan subscription on each re-render
// and leak async work into the next test.
const NO_EXISTING_ACCOUNTS: Account[] = [];
const NO_BLACKLISTED_TOKENS: string[] = [];

const renderScan = () =>
  renderHook(() =>
    useScanDeviceAccountsViewModel({
      existingAccounts: NO_EXISTING_ACCOUNTS,
      blacklistedTokenIds: NO_BLACKLISTED_TOKENS,
      analyticsMetadata,
    }),
  );

describe("useScanDeviceAccountsViewModel callbacks", () => {
  beforeEach(() => {
    resetSpies();
    (track as jest.Mock).mockClear();
    (prepareCurrency as jest.Mock).mockResolvedValue(undefined);
    setRouteParams("ethereum");
    setScanObservable(of(makeDiscoveredEvent(createAccount())));
  });

  it("runs the selection helpers and tracks the manual select-all", async () => {
    const { result } = renderScan();
    await waitFor(() => expect(result.current.scannedAccounts).toHaveLength(1));
    await waitFor(() => expect(result.current.scanning).toBe(false));

    const scanned = result.current.scannedAccounts;

    act(() => result.current.selectAll(scanned));
    expect(track).toHaveBeenCalledWith("select_all", expect.anything());

    act(() => result.current.unselectAll(scanned));
    act(() => result.current.onPressAccount(scanned[0]));
    expect(Array.isArray(result.current.selectedIds)).toBe(true);
  });

  it("does not track select-all when auto-selecting", async () => {
    const { result } = renderScan();
    await waitFor(() => expect(result.current.scannedAccounts).toHaveLength(1));

    act(() => result.current.selectAll(result.current.scannedAccounts, true));
    expect(track).not.toHaveBeenCalledWith("select_all", expect.anything());
  });

  it("imports selected accounts and replaces with the success screen (non-inline)", async () => {
    const { result } = renderScan();
    await waitFor(() => expect(result.current.scannedAccounts).toHaveLength(1));
    await waitFor(() => expect(result.current.scanning).toBe(false));

    act(() => result.current.importAccounts());

    expect(replace).toHaveBeenCalledWith(
      ScreenName.AddAccountsSuccess,
      expect.objectContaining({ accountsToAdd: expect.any(Array) }),
    );
    expect(track).toHaveBeenCalledWith("continue", expect.anything());
    expect(track).toHaveBeenCalledWith("accounts_added", expect.anything());
  });

  it("resolves inline import by popping before onSuccess and does not cancel", async () => {
    const callOrder: string[] = [];
    const onSuccess = jest.fn(() => callOrder.push("success"));
    const onCloseNavigation = jest.fn(() => callOrder.push("cancel"));
    pop.mockImplementation(() => callOrder.push("pop"));
    setRouteParams("ethereum", "device-1", { inline: true, onSuccess, onCloseNavigation });
    setScanObservable(of(makeDiscoveredEvent(createAccount())));

    const { result } = renderScan();
    await waitFor(() => expect(result.current.scannedAccounts).toHaveLength(1));
    await waitFor(() => expect(result.current.scanning).toBe(false));

    act(() => result.current.importAccounts());

    expect(onCloseNavigation).not.toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ selected: expect.any(Array) }),
    );
    expect(pop).toHaveBeenCalled();
    expect(callOrder).toEqual(["pop", "success"]);
    expect(replace).not.toHaveBeenCalledWith(ScreenName.AddAccountsSuccess, expect.anything());
    pop.mockReset();
  });

  it("pops the parent navigator on modal hide after a cancel (non-inline)", async () => {
    const { result } = renderScan();
    await waitFor(() => expect(result.current.scanning).toBe(false));

    act(() => result.current.onCancel());
    expect(result.current.error).toBeNull();

    act(() => result.current.onModalHide());
    expect(pop).toHaveBeenCalled();
  });

  it("closes the inline flow on modal hide after a cancel (inline)", async () => {
    const onCloseNavigation = jest.fn();
    setRouteParams("ethereum", "device-1", { inline: true, onCloseNavigation });
    setScanObservable(of(makeDiscoveredEvent(createAccount())));

    const { result } = renderScan();
    await waitFor(() => expect(result.current.scanning).toBe(false));

    act(() => result.current.onCancel());
    act(() => result.current.onModalHide());

    expect(onCloseNavigation).toHaveBeenCalled();
    expect(pop).toHaveBeenCalled();
  });

  it("does nothing on modal hide when not cancelled", async () => {
    const { result } = renderScan();
    await waitFor(() => expect(result.current.scanning).toBe(false));

    act(() => result.current.onModalHide());
    expect(pop).not.toHaveBeenCalled();
  });

  it("stops the subscription, ends scanning and tracks the stop event", async () => {
    // An observable that never completes keeps `scanning` true until stopSubscription is called.
    setScanObservable(new Observable<never>(() => undefined));

    const { result } = renderScan();
    await waitFor(() => expect(result.current.scanning).toBe(true));

    act(() => result.current.stopSubscription());
    expect(result.current.scanning).toBe(false);
    expect(track).toHaveBeenCalledWith("stop_scan", expect.anything());
  });

  it("restarts the scan on retry when not inline", async () => {
    const { result } = renderScan();
    await waitFor(() => expect(result.current.scanning).toBe(false));

    act(() => result.current.handleRetry());
    await waitFor(() => expect(result.current.scanning).toBe(false));
    expect(goBack).not.toHaveBeenCalled();
  });

  it("captures a scan error", async () => {
    (prepareCurrency as jest.Mock).mockRejectedValueOnce(new Error("scan failed"));

    const { result } = renderScan();

    await waitFor(() => expect(result.current.error).not.toBeNull());
  });

  it("goes back on retry when inline and an error occurred", async () => {
    setRouteParams("ethereum", "device-1", { inline: true });
    (prepareCurrency as jest.Mock).mockRejectedValueOnce(new Error("scan failed"));

    const { result } = renderScan();
    await waitFor(() => expect(result.current.error).not.toBeNull());

    act(() => result.current.handleRetry());
    expect(goBack).toHaveBeenCalled();
  });

  it("renames an account and reveals all created accounts", async () => {
    const { result } = renderScan();
    await waitFor(() => expect(result.current.scanning).toBe(false));

    act(() => result.current.onAccountNameChange("New name", createAccount()));

    act(() => result.current.viewAllCreatedAccounts());
    expect(result.current.showAllCreatedAccounts).toBe(true);
  });

  it("navigates to the accounts list when quitting the flow", async () => {
    const { result } = renderScan();
    await waitFor(() => expect(result.current.scanning).toBe(false));

    act(() => result.current.quitFlow());
    expect(navigate).toHaveBeenCalled();
  });
});
