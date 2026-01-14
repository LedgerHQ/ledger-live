import { CantonAccount } from "@ledgerhq/coin-canton/types";
import { createEmptyHistoryCache } from "@ledgerhq/coin-framework/account/balanceHistoryCache";
import {
  getDerivationModesForCurrency,
  getDerivationScheme,
  runDerivationScheme,
} from "@ledgerhq/coin-framework/derivation";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { renderHook } from "tests/testSetup";
import { useCantonCreatableAccounts } from "./useCantonCreatableAccounts";

const createMockAccount = (
  id: string,
  currencyId: string,
  used: boolean = false,
  isOnboarded: boolean = false,
): Account => {
  const currency = getCryptoCurrencyById(currencyId);
  const derivationMode = getDerivationModesForCurrency(currency)[0];
  const scheme = getDerivationScheme({ derivationMode, currency });
  const baseAccount: Account = {
    id,
    type: "Account",
    used,
    currency,
    derivationMode,
    index: 0,
    freshAddress: "test_address",
    freshAddressPath: runDerivationScheme(scheme, currency, {
      account: 0,
      node: 0,
      address: 0,
    }),
    creationDate: new Date(),
    lastSyncDate: new Date(),
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    seedIdentifier: "test_seed",
    blockHeight: 0,
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    balanceHistoryCache: createEmptyHistoryCache(),
    swapHistory: [],
    subAccounts: [],
  };

  if (currency.family === "canton") {
    return {
      ...baseAccount,
      cantonResources: {
        isOnboarded,
        instrumentUtxoCounts: {},
        pendingTransferProposals: [],
      },
    } as CantonAccount;
  }

  return baseAccount;
};

describe("useCantonCreatableAccounts", () => {
  it("should return false when no Canton accounts are present", () => {
    const scannedAccounts: Account[] = [createMockAccount("1", "bitcoin", false)];
    const selectedIds = ["1"];

    const { result } = renderHook(() =>
      useCantonCreatableAccounts({ scannedAccounts, selectedIds }),
    );

    expect(result.current.hasCantonCreatableAccounts).toBe(false);
    expect(result.current.cantonCreatableAccounts).toEqual([]);
    expect(result.current.selectedCantonCreatableAccounts).toEqual([]);
  });

  it("should return false when Canton accounts are onboarded", () => {
    const scannedAccounts: Account[] = [createMockAccount("1", "canton_network", false, true)];
    const selectedIds = ["1"];

    const { result } = renderHook(() =>
      useCantonCreatableAccounts({ scannedAccounts, selectedIds }),
    );

    expect(result.current.hasCantonCreatableAccounts).toBe(false);
    expect(result.current.cantonCreatableAccounts).toEqual([]);
    expect(result.current.selectedCantonCreatableAccounts).toEqual([]);
  });

  it("should return false when Canton accounts are not selected", () => {
    const scannedAccounts: Account[] = [createMockAccount("1", "canton_network", false)];
    const selectedIds: string[] = [];

    const { result } = renderHook(() =>
      useCantonCreatableAccounts({ scannedAccounts, selectedIds }),
    );

    expect(result.current.hasCantonCreatableAccounts).toBe(false);
    expect(result.current.cantonCreatableAccounts).toHaveLength(1);
    expect(result.current.selectedCantonCreatableAccounts).toEqual([]);
  });

  it("should return true when Canton creatable accounts are selected", () => {
    const scannedAccounts: Account[] = [createMockAccount("1", "canton_network", false, false)];
    const selectedIds = ["1"];

    const { result } = renderHook(() =>
      useCantonCreatableAccounts({ scannedAccounts, selectedIds }),
    );

    expect(result.current.hasCantonCreatableAccounts).toBe(true);
    expect(result.current.cantonCreatableAccounts).toHaveLength(1);
    expect(result.current.selectedCantonCreatableAccounts).toHaveLength(1);
    expect(result.current.selectedCantonCreatableAccounts.map(a => a.id)).toEqual(["1"]);
  });

  it("should handle empty scanned accounts array", () => {
    const scannedAccounts: Account[] = [];
    const selectedIds: string[] = [];

    const { result } = renderHook(() =>
      useCantonCreatableAccounts({ scannedAccounts, selectedIds }),
    );

    expect(result.current.hasCantonCreatableAccounts).toBe(false);
    expect(result.current.cantonCreatableAccounts).toEqual([]);
    expect(result.current.selectedCantonCreatableAccounts).toEqual([]);
  });

  it("should update results when props change", () => {
    const initialScannedAccounts: Account[] = [
      createMockAccount("1", "canton_network", false, false),
    ];
    const initialSelectedIds = ["1"];

    const { result, rerender } = renderHook(
      ({ scannedAccounts, selectedIds }) =>
        useCantonCreatableAccounts({ scannedAccounts, selectedIds }),
      {
        initialProps: {
          scannedAccounts: initialScannedAccounts,
          selectedIds: initialSelectedIds,
        },
      },
    );

    expect(result.current.hasCantonCreatableAccounts).toBe(true);

    // Update to deselect the account
    rerender({
      scannedAccounts: initialScannedAccounts,
      selectedIds: [],
    });

    expect(result.current.hasCantonCreatableAccounts).toBe(false);
    expect(result.current.selectedCantonCreatableAccounts).toEqual([]);
  });
});
