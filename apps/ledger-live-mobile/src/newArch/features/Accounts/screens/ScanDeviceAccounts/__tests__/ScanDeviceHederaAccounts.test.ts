import { setupScanDeviceTests } from "./shared";
import BigNumber from "bignumber.js";
import { Observable, of, EMPTY } from "rxjs";
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

const createHederaAccount = (overrides?: Partial<Account>): Account => {
  const balance = overrides?.balance ?? new BigNumber(0);
  return {
    type: "Account",
    id: overrides?.id ?? "js:hedera:0.0.12345:hederaBip44",
    seedIdentifier: "seed",
    derivationMode: "",
    index: 0,
    freshAddress: "0.0.12345",
    freshAddressPath: "44/3030",
    used: false,
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

describe("ScanDeviceHederaAccounts", () => {
  beforeEach(() => {
    resetSpies();
    setRouteParams("hedera");
    setScanObservable(EMPTY);
  });

  it("keeps an empty Hedera account importable when scanned alone", async () => {
    const emptyAccount = createHederaAccount({ balance: new BigNumber(0) });

    setScanObservable(of<ScanAccountEvent>({ type: "discovered", account: emptyAccount }));

    const { result } = renderHook(() =>
      useScanDeviceAccountsViewModel({
        existingAccounts: [],
        blacklistedTokenIds: [],
        analyticsMetadata: {},
      }),
    );

    await waitFor(() => expect(result.current.scannedAccounts).toHaveLength(1));
    await waitFor(() => expect(result.current.scanning).toBe(false));

    expect(result.current.scannedAccounts).toHaveLength(1);
    expect(result.current.scannedAccounts[0].id).toBe(emptyAccount.id);
    expect(replace).not.toHaveBeenCalledWith(ScreenName.NoAssociatedAccounts, expect.anything());
  });

  it("does not navigate away when multiple Hedera accounts (including empty) are found", async () => {
    const emptyAccount = createHederaAccount({ balance: new BigNumber(0) });
    const fundedAccount = createHederaAccount({
      id: "js:hedera:0.0.67890:hederaBip44",
      balance: new BigNumber(1000000),
      used: true,
    });

    setScanObservable(
      new Observable<ScanAccountEvent>(subscriber => {
        subscriber.next(makeDiscoveredEvent(emptyAccount));
        setTimeout(() => {
          subscriber.next(makeDiscoveredEvent(fundedAccount));
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
      expect.arrayContaining([emptyAccount.id, fundedAccount.id]),
    );
    expect(replace).not.toHaveBeenCalledWith(ScreenName.NoAssociatedAccounts, expect.anything());
  });

  it("navigates to NoAssociatedAccounts when no Hedera accounts are discovered", async () => {
    setScanObservable(EMPTY);

    renderHook(() =>
      useScanDeviceAccountsViewModel({
        existingAccounts: [],
        blacklistedTokenIds: [],
        analyticsMetadata: {},
      }),
    );

    await waitFor(() => expect(replace).toHaveBeenCalled());

    expect(replace).toHaveBeenCalledWith(ScreenName.NoAssociatedAccounts, {
      CustomNoAssociatedAccounts: expect.any(Function),
    });
  });
});
