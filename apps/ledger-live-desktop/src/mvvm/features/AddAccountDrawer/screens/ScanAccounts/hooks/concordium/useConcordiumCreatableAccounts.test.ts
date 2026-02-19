import { ConcordiumAccount } from "@ledgerhq/coin-concordium/types";
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
import { useConcordiumCreatableAccounts } from "./useConcordiumCreatableAccounts";

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

  if (currency.family === "concordium") {
    return {
      ...baseAccount,
      concordiumResources: {
        isOnboarded,
        credId: "test_cred_id",
        publicKey: "test_public_key",
        identityIndex: 0,
        credNumber: 0,
        ipIdentity: 0,
      },
    } as ConcordiumAccount;
  }

  return baseAccount;
};

describe("useConcordiumCreatableAccounts", () => {
  it("should return false when no Concordium accounts are present", () => {
    const scannedAccounts: Account[] = [createMockAccount("1", "bitcoin", false)];
    const selectedIds = ["1"];

    const { result } = renderHook(() =>
      useConcordiumCreatableAccounts({ scannedAccounts, selectedIds }),
    );

    expect(result.current.hasConcordiumCreatableAccounts).toBe(false);
    expect(result.current.selectedConcordiumAccounts).toEqual([]);
  });

  it("should return false when Concordium accounts are onboarded", () => {
    const scannedAccounts: Account[] = [createMockAccount("1", "concordium", false, true)];
    const selectedIds = ["1"];

    const { result } = renderHook(() =>
      useConcordiumCreatableAccounts({ scannedAccounts, selectedIds }),
    );

    expect(result.current.hasConcordiumCreatableAccounts).toBe(false);
    expect(result.current.selectedConcordiumAccounts).toHaveLength(1);
  });

  it("should return false when Concordium accounts are not selected", () => {
    const scannedAccounts: Account[] = [createMockAccount("1", "concordium", false)];
    const selectedIds: string[] = [];

    const { result } = renderHook(() =>
      useConcordiumCreatableAccounts({ scannedAccounts, selectedIds }),
    );

    expect(result.current.hasConcordiumCreatableAccounts).toBe(false);
    expect(result.current.selectedConcordiumAccounts).toEqual([]);
  });

  it("should return true when Concordium creatable accounts are selected", () => {
    const scannedAccounts: Account[] = [createMockAccount("1", "concordium", false, false)];
    const selectedIds = ["1"];

    const { result } = renderHook(() =>
      useConcordiumCreatableAccounts({ scannedAccounts, selectedIds }),
    );

    expect(result.current.hasConcordiumCreatableAccounts).toBe(true);
    expect(result.current.selectedConcordiumAccounts).toHaveLength(1);
    expect(result.current.selectedConcordiumAccounts.map(a => a.id)).toEqual(["1"]);
  });

  it("should handle empty scanned accounts array", () => {
    const scannedAccounts: Account[] = [];
    const selectedIds: string[] = [];

    const { result } = renderHook(() =>
      useConcordiumCreatableAccounts({ scannedAccounts, selectedIds }),
    );

    expect(result.current.hasConcordiumCreatableAccounts).toBe(false);
    expect(result.current.selectedConcordiumAccounts).toEqual([]);
  });

  it("should update results when props change", () => {
    const initialScannedAccounts: Account[] = [createMockAccount("1", "concordium", false, false)];
    const initialSelectedIds = ["1"];

    const { result, rerender } = renderHook(
      ({ scannedAccounts, selectedIds }) =>
        useConcordiumCreatableAccounts({ scannedAccounts, selectedIds }),
      {
        initialProps: {
          scannedAccounts: initialScannedAccounts,
          selectedIds: initialSelectedIds,
        },
      },
    );

    expect(result.current.hasConcordiumCreatableAccounts).toBe(true);

    // Update to deselect the account
    rerender({
      scannedAccounts: initialScannedAccounts,
      selectedIds: [],
    });

    expect(result.current.hasConcordiumCreatableAccounts).toBe(false);
    expect(result.current.selectedConcordiumAccounts).toEqual([]);
  });

  it("should include both onboarded and creatable accounts in selectedConcordiumAccounts", () => {
    const scannedAccounts: Account[] = [
      createMockAccount("1", "concordium", false, true), // onboarded
      createMockAccount("2", "concordium", false, false), // creatable
    ];
    const selectedIds = ["1", "2"];

    const { result } = renderHook(() =>
      useConcordiumCreatableAccounts({ scannedAccounts, selectedIds }),
    );

    expect(result.current.hasConcordiumCreatableAccounts).toBe(true);
    expect(result.current.selectedConcordiumAccounts).toHaveLength(2);
  });

  it("should filter out non-Concordium accounts from selectedConcordiumAccounts", () => {
    const scannedAccounts: Account[] = [
      createMockAccount("1", "concordium", false, false),
      createMockAccount("2", "bitcoin", false),
    ];
    const selectedIds = ["1", "2"];

    const { result } = renderHook(() =>
      useConcordiumCreatableAccounts({ scannedAccounts, selectedIds }),
    );

    expect(result.current.hasConcordiumCreatableAccounts).toBe(true);
    expect(result.current.selectedConcordiumAccounts).toHaveLength(1);
    expect(result.current.selectedConcordiumAccounts[0].id).toBe("1");
  });
});
