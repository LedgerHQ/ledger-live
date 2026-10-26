import { setupScanDeviceTests } from "./shared";
import BigNumber from "bignumber.js";
import { of, EMPTY, Observable } from "rxjs";
import type { Account, ScanAccountEvent } from "@ledgerhq/types-live";
import { renderHook, waitFor } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import useScanDeviceAccountsViewModel from "../useScanDeviceAccountsViewModel";

const {
  replace,
  setRouteParams,
  setScanObservable,
  makeDiscoveredEvent,
  resetSpies,
  getCurrentCurrency,
} = setupScanDeviceTests();

const createAccount = (overrides?: Partial<Account>): Account => {
  const balance = overrides?.balance ?? new BigNumber(0);
  return {
    type: "Account",
    id: overrides?.id ?? "js:eth:0:eth",
    seedIdentifier: "seed",
    derivationMode: "",
    index: 0,
    freshAddress: "0xabc",
    freshAddressPath: "44/60",
    used: overrides?.used ?? false,
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

describe("ScanDeviceAccounts (common coins)", () => {
  beforeEach(() => {
    resetSpies();
    setRouteParams("ethereum");
    setScanObservable(EMPTY);
  });

  it("stores a single discovered ETH account", async () => {
    const ethAccount = createAccount({ balance: new BigNumber(1234), used: true });
    setScanObservable(of(makeDiscoveredEvent(ethAccount)));

    const { result } = renderHook(() =>
      useScanDeviceAccountsViewModel({
        existingAccounts: [],
        blacklistedTokenIds: [],
        analyticsMetadata: {},
      }),
    );

    await waitFor(() => expect(result.current.scannedAccounts).toHaveLength(1));
    await waitFor(() => expect(result.current.scanning).toBe(false));

    expect(result.current.scannedAccounts[0].id).toBe(ethAccount.id);
    expect(replace).not.toHaveBeenCalledWith(ScreenName.NoAssociatedAccounts, expect.anything());
  });

  it("stores multiple discovered BTC accounts", async () => {
    setRouteParams("bitcoin");
    const btcAccount1 = createAccount({
      id: "js:btc:0:segwit",
      balance: new BigNumber(10_000),
      used: true,
    });
    const btcAccount2 = createAccount({
      id: "js:btc:1:segwit",
      balance: new BigNumber(0),
      used: false,
    });

    setScanObservable(
      new Observable<ScanAccountEvent>(subscriber => {
        subscriber.next(makeDiscoveredEvent(btcAccount1));
        setTimeout(() => {
          subscriber.next(makeDiscoveredEvent(btcAccount2));
          subscriber.complete();
        }, 0);
      }),
    );

    const { result } = renderHook(() =>
      useScanDeviceAccountsViewModel({
        existingAccounts: [],
        blacklistedTokenIds: [],
        analyticsMetadata: {},
      }),
    );

    await waitFor(() => expect(result.current.scannedAccounts).toHaveLength(2));
    await waitFor(() => expect(result.current.scanning).toBe(false));

    expect(result.current.scannedAccounts.map(a => a.id)).toEqual(
      expect.arrayContaining([btcAccount1.id, btcAccount2.id]),
    );
    expect(replace).not.toHaveBeenCalledWith(ScreenName.NoAssociatedAccounts, expect.anything());
  });

  it("falls back to the default Confirm label when no custom flow provides a confirm i18n key", async () => {
    const { result } = renderHook(() =>
      useScanDeviceAccountsViewModel({
        existingAccounts: [],
        blacklistedTokenIds: [],
        analyticsMetadata: {},
      }),
    );

    await waitFor(() => expect(result.current.scanning).toBe(false));
    expect(result.current.confirmLabel).toBe("Confirm");
  });

  it("does not treat a rescanned account with the same address as already imported when its id differs (no custom flow)", async () => {
    // Unlike Aleo (which overrides isAlreadyImportedAccount because it reassigns ids on view-key
    // grant), common coins keep the plain id-based check: a different id is a different account.
    const existingAccount = createAccount({ id: "js:eth:existing-id:eth", freshAddress: "0xabc" });
    const rescannedAccount = createAccount({
      id: "js:eth:different-id:eth",
      freshAddress: "0xabc",
      used: false,
    });
    setScanObservable(of(makeDiscoveredEvent(rescannedAccount)));

    const { result } = renderHook(() =>
      useScanDeviceAccountsViewModel({
        existingAccounts: [existingAccount],
        blacklistedTokenIds: [],
        analyticsMetadata: {},
      }),
    );

    await waitFor(() => expect(result.current.scannedAccounts).toHaveLength(1));
    await waitFor(() => expect(result.current.scanning).toBe(false));

    // Treated as a new, not-yet-imported account, so it gets auto-selected.
    expect(result.current.selectedIds).toEqual([rescannedAccount.id]);
  });

  it("does not navigate to NoAssociatedAccounts when no accounts found for ETH", async () => {
    setScanObservable(EMPTY);

    const { result } = renderHook(() =>
      useScanDeviceAccountsViewModel({
        existingAccounts: [],
        blacklistedTokenIds: [],
        analyticsMetadata: {},
      }),
    );

    await waitFor(() => expect(result.current.scanning).toBe(false));
    expect(replace).not.toHaveBeenCalled();
  });
});
