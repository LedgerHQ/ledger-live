import { setupScanDeviceTests } from "./shared";
import BigNumber from "bignumber.js";
import { Observable, of } from "rxjs";
import { DdRum } from "@datadog/mobile-react-native";
import type { Account, ScanAccountEvent } from "@ledgerhq/types-live";
import { act, renderHook, waitFor } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import { prepareCurrency } from "~/bridge/cache";
import {
  isRumOperationActive,
  resetRumOperationsForTests,
  RumOperation,
} from "LLM/utils/rumOperation";
import useScanDeviceAccountsViewModel from "../useScanDeviceAccountsViewModel";

jest.mock("@datadog/mobile-react-native", () => require("@tests/mocks/datadogMobileReactNative"));
jest.mock("~/datadog", () => ({ isDatadogRecording: () => true }));

// Synchronous bridge hooks, as in ScanDeviceAccountsCallbacks.test. The currency bridge is a new
// object on each render, so every render re-runs the scan effect: the operation must not follow it.
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
  pop,
  setRouteParams,
  makeDiscoveredEvent,
  resetSpies,
  getCurrentCurrency,
} = setupScanDeviceTests();

const setScanObservable = (obs: Observable<ScanAccountEvent>) => __setScanObservable(obs);

const startFeatureOperation = jest.mocked(DdRum.startFeatureOperation);
const succeedFeatureOperation = jest.mocked(DdRum.succeedFeatureOperation);
const failFeatureOperation = jest.mocked(DdRum.failFeatureOperation);

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

// Stable references: fresh arrays on each render would restart the scan subscription.
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

/** The attributes, last argument of the latest call to an SDK feature operation method. */
const lastCallAttributes = (sdkMethod: { mock: { calls: unknown[][] } }) =>
  sdkMethod.mock.calls.at(-1)?.at(-1);

describe("useScanDeviceAccountsViewModel add_account RUM operation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetSpies();
    resetRumOperationsForTests();
    (prepareCurrency as jest.Mock).mockResolvedValue(undefined);
    setRouteParams("ethereum", "device-1", { context: "addAccounts" });
    setScanObservable(of(makeDiscoveredEvent(createAccount())));
  });

  it("should start the operation with the flow attributes when the scan starts", async () => {
    const { result } = renderScan();
    await waitFor(() => expect(result.current.scanning).toBe(false));

    expect(startFeatureOperation).toHaveBeenCalledTimes(1);
    expect(startFeatureOperation.mock.calls[0]).toStrictEqual([
      "add_account",
      null,
      { currency_id: "ethereum", inline: false, context: "addAccounts", attempt: 1 },
    ]);
  });

  it("should succeed with the number of added accounts before replacing with the success screen", async () => {
    const { result } = renderScan();
    await waitFor(() => expect(result.current.scannedAccounts).toHaveLength(1));
    await waitFor(() => expect(result.current.scanning).toBe(false));

    act(() => result.current.importAccounts());

    expect(succeedFeatureOperation).toHaveBeenCalledTimes(1);
    expect(succeedFeatureOperation).toHaveBeenCalledWith("add_account", null, {
      currency_id: "ethereum",
      inline: false,
      context: "addAccounts",
      attempt: 1,
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
    expect(lastCallAttributes(failFeatureOperation)).toMatchObject({ error_name: "TypeError" });
  });

  it("should fail with OTHER when the currency is region restricted", async () => {
    const regionRestricted = new Error("restricted");
    regionRestricted.name = "CurrencyRegionRestrictedError";
    (prepareCurrency as jest.Mock).mockRejectedValueOnce(regionRestricted);
    setRouteParams("ethereum", "device-1", { inline: true, onCloseNavigation: jest.fn() });

    renderScan();
    // The inline flow closes right away and clears the error, so wait on the event itself.
    await waitFor(() => expect(failFeatureOperation).toHaveBeenCalledTimes(1));

    expect(failFeatureOperation.mock.calls[0][2]).toBe("OTHER");
    expect(lastCallAttributes(failFeatureOperation)).toMatchObject({
      error_name: "CurrencyRegionRestrictedError",
    });
  });

  it("should start a new attempt when retrying after a scan error", async () => {
    (prepareCurrency as jest.Mock).mockRejectedValueOnce(new Error("scan failed"));

    const { result } = renderScan();
    await waitFor(() => expect(result.current.error).not.toBeNull());

    act(() => result.current.handleRetry());
    await waitFor(() => expect(result.current.scanning).toBe(false));

    expect(startFeatureOperation).toHaveBeenCalledTimes(2);
    expect(lastCallAttributes(startFeatureOperation)).toMatchObject({ attempt: 2 });
    expect(isRumOperationActive(RumOperation.AddAccount)).toBe(true);
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
    const { result, rerender } = renderScan();
    await waitFor(() => expect(result.current.scanning).toBe(false));
    act(() => result.current.quitFlow());

    // The bridge mock returns a new object on each render, which re-runs the scan effect.
    rerender({});
    await waitFor(() => expect(result.current.scanning).toBe(false));

    expect(startFeatureOperation).toHaveBeenCalledTimes(1);
    expect(isRumOperationActive(RumOperation.AddAccount)).toBe(false);
  });

  it("should fail with OTHER when the user quits with nothing to add", async () => {
    const { result } = renderScan();
    await waitFor(() => expect(result.current.scanning).toBe(false));

    act(() => result.current.quitFlow());

    expect(failFeatureOperation).toHaveBeenCalledTimes(1);
    expect(failFeatureOperation.mock.calls[0][2]).toBe("OTHER");
    expect(lastCallAttributes(failFeatureOperation)).toMatchObject({ outcome: "nothing_to_add" });
    expect(navigate).toHaveBeenCalled();
  });

  it("should fail with OTHER before opening the empty-account warning", async () => {
    setRouteParams("bitcoin");
    const emptyAccount = createAccount({
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

    expect(failFeatureOperation).toHaveBeenCalledTimes(1);
    expect(failFeatureOperation.mock.calls[0][2]).toBe("OTHER");
    expect(lastCallAttributes(failFeatureOperation)).toMatchObject({
      outcome: "already_empty_account",
    });
  });

  it("should fail with OTHER before opening the no associated accounts screen", async () => {
    setRouteParams("hedera");
    const importedAccount = createAccount({ id: "js:hedera:0.0.12345:hederaBip44", used: true });
    setScanObservable(of(makeDiscoveredEvent(importedAccount)));
    const existingAccounts = [importedAccount];

    renderScan(existingAccounts);
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(ScreenName.NoAssociatedAccounts, expect.anything()),
    );

    expect(failFeatureOperation).toHaveBeenCalledTimes(1);
    expect(failFeatureOperation.mock.calls[0][2]).toBe("OTHER");
    expect(lastCallAttributes(failFeatureOperation)).toMatchObject({
      outcome: "no_associated_accounts",
    });
  });

  it("should abandon the operation when the screen unmounts during the flow", async () => {
    const { result, unmount } = renderScan();
    await waitFor(() => expect(result.current.scanning).toBe(false));

    unmount();

    expect(failFeatureOperation).toHaveBeenCalledTimes(1);
    expect(failFeatureOperation.mock.calls[0][2]).toBe("ABANDONED");
    expect(lastCallAttributes(failFeatureOperation)).toMatchObject({ trigger: "unmount" });
  });
});
