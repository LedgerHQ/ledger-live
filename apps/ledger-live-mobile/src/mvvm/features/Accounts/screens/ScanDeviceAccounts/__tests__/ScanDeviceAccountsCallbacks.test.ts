import { setupScanDeviceTests } from "./shared";
import BigNumber from "bignumber.js";
import { Observable, of } from "rxjs";
import type { Account, ScanAccountEvent } from "@ledgerhq/types-live";
import { act, renderHook, waitFor } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import { track } from "~/analytics";
import { prepareCurrency } from "~/bridge/cache";
import type { AnalyticMetadata } from "LLM/hooks/useAnalytics/types";
import useScanDeviceAccountsViewModel from "../useScanDeviceAccountsViewModel";

// Mock the bridge hooks so scanning is fully synchronous and has a *stable* identity.
// The real `useCurrencyBridge` returns a fresh object each render, which would restart the
// scan subscription on every re-render and leak async work between tests.
jest.mock("@ledgerhq/live-common/bridge/useCurrencyBridge", () => {
  const state: { obs: unknown } = { obs: require("rxjs").EMPTY };
  return {
    __esModule: true,
    useCurrencyBridge: () => ({
      scanAccounts: () => state.obs,
      preload: () => Promise.resolve(undefined),
      hydrate: () => {},
    }),
    __setScanObservable: (obs: unknown) => {
      state.obs = obs;
    },
  };
});

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  __esModule: true,
  useAccountBridgeOrNull: () => ({ isAccountEmpty: () => false }),
}));

const { __setScanObservable } = jest.requireMock(
  "@ledgerhq/live-common/bridge/useCurrencyBridge",
) as { __setScanObservable: (obs: unknown) => void };

const {
  replace,
  navigate,
  goBack,
  pop,
  setRouteParams,
  makeDiscoveredEvent,
  resetSpies,
  getCurrentCurrency,
} = setupScanDeviceTests();

const setScanObservable = (obs: Observable<ScanAccountEvent>) => __setScanObservable(obs);

const createAccount = (overrides?: Partial<Account>): Account => {
  const balance = overrides?.balance ?? new BigNumber(1000);
  return {
    type: "Account",
    id: overrides?.id ?? "js:eth:0:eth",
    seedIdentifier: "seed",
    derivationMode: "",
    index: 0,
    freshAddress: "0xabc",
    freshAddressPath: "44/60",
    used: overrides?.used ?? true,
    balance,
    spendableBalance: balance,
    creationDate: new Date(),
    blockHeight: 0,
    currency: getCurrentCurrency(),
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(),
    balanceHistoryCache: {
      HOUR: { latestDate: null, balances: [] },
      DAY: { latestDate: null, balances: [] },
      WEEK: { latestDate: null, balances: [] },
    },
    swapHistory: [],
    subAccounts: [],
    ...overrides,
  };
};

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

  it("closes the inline flow and calls onSuccess when importing inline", async () => {
    const onSuccess = jest.fn();
    const onCloseNavigation = jest.fn();
    setRouteParams("ethereum", "device-1", { inline: true, onSuccess, onCloseNavigation });
    setScanObservable(of(makeDiscoveredEvent(createAccount())));

    const { result } = renderScan();
    await waitFor(() => expect(result.current.scannedAccounts).toHaveLength(1));
    await waitFor(() => expect(result.current.scanning).toBe(false));

    act(() => result.current.importAccounts());

    expect(onCloseNavigation).toHaveBeenCalled();
    expect(pop).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ selected: expect.any(Array) }),
    );
    expect(replace).not.toHaveBeenCalledWith(ScreenName.AddAccountsSuccess, expect.anything());
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
