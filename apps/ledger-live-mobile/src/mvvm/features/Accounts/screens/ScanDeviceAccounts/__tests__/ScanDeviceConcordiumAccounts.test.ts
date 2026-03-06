import { setupScanDeviceTests } from "./shared";
import BigNumber from "bignumber.js";
import { of, EMPTY } from "rxjs";
import type { Account } from "@ledgerhq/types-live";
import { renderHook, waitFor, act } from "@tests/test-renderer";
import { NavigatorName, ScreenName } from "~/const";
import useScanDeviceAccountsViewModel from "../useScanDeviceAccountsViewModel";

jest.mock("@ledgerhq/coin-concordium/bridge/serialization", () => ({
  isConcordiumAccount: (account: Account) =>
    account.currency?.family === "concordium" && "concordiumResources" in account,
}));

const {
  replace,
  setRouteParams,
  setScanObservable,
  makeDiscoveredEvent,
  resetSpies,
  getCurrentCurrency,
} = setupScanDeviceTests();

const createConcordiumAccount = (
  overrides?: Partial<Account> & { concordiumResources?: { isOnboarded: boolean } },
): Account => {
  const balance = overrides?.balance ?? new BigNumber(0);
  return {
    type: "Account",
    id: overrides?.id ?? "js:concordium:0",
    seedIdentifier: "seed",
    derivationMode: "",
    index: 0,
    freshAddress: "3abc",
    freshAddressPath: "44/7677",
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
    concordiumResources: overrides?.concordiumResources ?? { isOnboarded: false },
    ...overrides,
  } as Account;
};

describe("ScanDeviceConcordiumAccounts", () => {
  beforeEach(() => {
    resetSpies();
    setRouteParams("concordium");
    setScanObservable(EMPTY);
  });

  it("should navigate to concordium onboard when account needs onboarding", async () => {
    const account = createConcordiumAccount({ concordiumResources: { isOnboarded: false } });
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

    expect(replace).toHaveBeenCalledWith(NavigatorName.ConcordiumOnboard, {
      screen: ScreenName.ConcordiumOnboardAccount,
      params: {
        accountsToAdd: expect.arrayContaining([expect.objectContaining({ id: account.id })]),
        currency: expect.objectContaining({ id: "concordium" }),
      },
    });
  });

  it("should not navigate to onboard when account is already onboarded", async () => {
    const account = createConcordiumAccount({ concordiumResources: { isOnboarded: true } });
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

    expect(replace).not.toHaveBeenCalledWith(NavigatorName.ConcordiumOnboard, expect.anything());
  });
});
