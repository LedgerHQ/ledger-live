import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { Account } from "@ledgerhq/types-live";
import { renderHook } from "@testing-library/react";
import { createMockAccount as createMockCantonAccount } from "~/renderer/families/canton/__tests__/testUtils";
import { useOnboardingAccounts } from "../useOnboardingAccounts";

const createMockAccount = (
  id: string,
  currencyId: string,
  used: boolean = false,
  overrides: Partial<Account> = {},
): Account => {
  const currency = getCryptoCurrencyById(currencyId);
  return createMockCantonAccount({
    id,
    currency,
    used,
    ...overrides,
  });
};

describe("useOnboardingAccounts", () => {
  const mockCurrency = getCryptoCurrencyById("canton_network");

  it("should handle empty scanned accounts array", () => {
    const scannedAccounts: Account[] = [];
    const selectedIds: string[] = [];

    const { result } = renderHook(() =>
      useOnboardingAccounts({ currency: mockCurrency, scannedAccounts, selectedIds }),
    );

    expect(result.current.hasOnboardingCreatableAccounts).toBe(false);
    expect(result.current.selectedOnboardingAccounts).toEqual([]);
  });

  it("should return false when accounts are not selected", () => {
    const scannedAccounts: Account[] = [createMockAccount("1", "canton_network", false)];
    const selectedIds: string[] = [];

    const { result } = renderHook(() =>
      useOnboardingAccounts({ currency: mockCurrency, scannedAccounts, selectedIds }),
    );

    expect(result.current.hasOnboardingCreatableAccounts).toBe(false);
    expect(result.current.selectedOnboardingAccounts).toEqual([]);
  });

  it("should return false when currency does not support onboarding", () => {
    const scannedAccounts: Account[] = [createMockAccount("1", "bitcoin", false)];
    const selectedIds = ["1"];

    const { result } = renderHook(() =>
      useOnboardingAccounts({
        currency: getCryptoCurrencyById("bitcoin"),
        scannedAccounts,
        selectedIds,
      }),
    );

    expect(result.current.hasOnboardingCreatableAccounts).toBe(false);
    expect(result.current.selectedOnboardingAccounts).toEqual([]);
  });

  it("should return true when creatable accounts are selected", () => {
    const scannedAccounts: Account[] = [
      createMockAccount("1", "canton_network", false, {
        cantonResources: { isOnboarded: false, instrumentUtxoCounts: {}, pendingTransferProposals: [] },
      }),
    ];
    const selectedIds = ["1"];

    const { result } = renderHook(() =>
      useOnboardingAccounts({ currency: mockCurrency, scannedAccounts, selectedIds }),
    );

    expect(result.current.hasOnboardingCreatableAccounts).toBe(true);
    expect(result.current.selectedOnboardingAccounts).toHaveLength(1);
    expect(result.current.selectedOnboardingAccounts.map((a: Account) => a.id)).toEqual(["1"]);
  });

  it("should return importable accounts when used accounts are selected", () => {
    const scannedAccounts: Account[] = [createMockAccount("1", "canton_network", true)];
    const selectedIds = ["1"];

    const { result } = renderHook(() =>
      useOnboardingAccounts({ currency: mockCurrency, scannedAccounts, selectedIds }),
    );

    expect(result.current.hasOnboardingCreatableAccounts).toBe(false);
    expect(result.current.selectedOnboardingAccounts).toHaveLength(1);
    expect(result.current.selectedOnboardingAccounts.map((a: Account) => a.id)).toEqual(["1"]);
  });

  it("should return both importable and creatable accounts when selected", () => {
    const scannedAccounts: Account[] = [
      createMockAccount("1", "canton_network", true, {
        cantonResources: { isOnboarded: true, instrumentUtxoCounts: {}, pendingTransferProposals: [] },
      }), // importable
      createMockAccount("2", "canton_network", false, {
        cantonResources: { isOnboarded: false, instrumentUtxoCounts: {}, pendingTransferProposals: [] },
      }), // creatable
    ];
    const selectedIds = ["1", "2"];

    const { result } = renderHook(() =>
      useOnboardingAccounts({ currency: mockCurrency, scannedAccounts, selectedIds }),
    );

    expect(result.current.hasOnboardingCreatableAccounts).toBe(true);
    expect(result.current.selectedOnboardingAccounts).toHaveLength(2);
    expect(result.current.selectedOnboardingAccounts.map((a: Account) => a.id)).toEqual(["1", "2"]);
  });

  it("should update results when props change", () => {
    const initialScannedAccounts: Account[] = [
      createMockAccount("1", "canton_network", false, {
        cantonResources: { isOnboarded: false, instrumentUtxoCounts: {}, pendingTransferProposals: [] },
      }),
    ];
    const initialSelectedIds = ["1"];

    const { result, rerender } = renderHook(
      ({ currency, scannedAccounts, selectedIds }) =>
        useOnboardingAccounts({ currency, scannedAccounts, selectedIds }),
      {
        initialProps: {
          currency: mockCurrency,
          scannedAccounts: initialScannedAccounts,
          selectedIds: initialSelectedIds,
        },
      },
    );

    expect(result.current.hasOnboardingCreatableAccounts).toBe(true);

    rerender({
      currency: mockCurrency,
      scannedAccounts: initialScannedAccounts,
      selectedIds: [],
    });

    expect(result.current.hasOnboardingCreatableAccounts).toBe(false);
    expect(result.current.selectedOnboardingAccounts).toEqual([]);
  });
});
