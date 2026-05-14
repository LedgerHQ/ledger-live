import { setupScanDeviceTests } from "./shared";
import BigNumber from "bignumber.js";
import { of, EMPTY } from "rxjs";
import type { Account } from "@ledgerhq/types-live";
import { renderHook, waitFor, act } from "@tests/test-renderer";
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

const createAleoAccount = (overrides?: Partial<Account>): Account => {
  const balance = overrides?.balance ?? new BigNumber(0);

  return {
    type: "Account",
    id: overrides?.id ?? "js:aleo:0:aleo",
    seedIdentifier: "seed",
    derivationMode: "",
    index: 0,
    freshAddress: "aleo1abc",
    freshAddressPath: "44/0",
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

describe("ScanDeviceAleoAccounts", () => {
  beforeEach(() => {
    resetSpies();
    setRouteParams("aleo");
    setScanObservable(EMPTY);
  });

  it("routes to Aleo view key warning flow before final import", async () => {
    const account = createAleoAccount({ used: false });
    setScanObservable(of(makeDiscoveredEvent(account)));

    const { result } = renderHook(() =>
      useScanDeviceAccountsViewModel({
        existingAccounts: [],
        blacklistedTokenIds: [],
        analyticsMetadata: {},
      }),
    );

    await waitFor(() => expect(result.current.scannedAccounts).toHaveLength(1));
    await waitFor(() => expect(result.current.scanning).toBe(false));
    await waitFor(() => expect(result.current.selectedIds).toContain(account.id));

    await act(() => {
      result.current.importAccounts();
    });

    expect(replace).toHaveBeenCalledWith(
      ScreenName.AleoViewKeyWarning,
      expect.objectContaining({
        accountsToAdd: expect.arrayContaining([expect.objectContaining({ id: account.id })]),
        currency: expect.objectContaining({ id: "aleo" }),
        onCancelFlow: expect.any(Function),
        onConfirmImport: expect.any(Function),
      }),
    );
  });
});
