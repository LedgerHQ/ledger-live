import { renderHook } from "@testing-library/react";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { useSelector } from "LLD/hooks/redux";
import { useSwapDefaultAccounts } from "./useSwapDefaultAccounts";

jest.mock("LLD/hooks/redux");

const mockedUseSelector = jest.mocked(useSelector);

const account = (id: string): Account => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return { id, type: "Account" } as Account;
};

const tokenAccount = (id: string, parentId: string): AccountLike => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return { id, parentId, type: "TokenAccount" } as AccountLike;
};

describe("useSwapDefaultAccounts", () => {
  const fromParentAccount = account("from-parent");
  const fromTokenAccount = tokenAccount("from-token", fromParentAccount.id);
  const toParentAccount = account("to-parent");
  const toTokenAccount = tokenAccount("to-token", toParentAccount.id);
  const standaloneToAccount = account("to-account");
  const accounts = [
    fromParentAccount,
    fromTokenAccount,
    toParentAccount,
    toTokenAccount,
    standaloneToAccount,
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseSelector.mockReturnValue(accounts);
  });

  it("returns raw ids and resolves both accounts from object-shaped defaultAccountId", () => {
    const { result } = renderHook(() =>
      useSwapDefaultAccounts({
        defaultAccountId: {
          fromAccountId: fromTokenAccount.id,
          toAccountId: toTokenAccount.id,
        },
      }),
    );

    expect(result.current).toEqual({
      rawFromAccountId: fromTokenAccount.id,
      rawToAccountId: toTokenAccount.id,
      resolvedDefaultFromAccount: fromTokenAccount,
      resolvedDefaultFromParentAccount: fromParentAccount,
      resolvedDefaultToAccount: toTokenAccount,
      resolvedDefaultToParentAccount: toParentAccount,
    });
  });

  it("treats legacy string defaultAccountId as the to account id", () => {
    const { result } = renderHook(() =>
      useSwapDefaultAccounts({
        defaultAccountId: standaloneToAccount.id,
      }),
    );

    expect(result.current.rawFromAccountId).toBeUndefined();
    expect(result.current.rawToAccountId).toBe(standaloneToAccount.id);
    expect(result.current.resolvedDefaultFromAccount).toBeUndefined();
    expect(result.current.resolvedDefaultToAccount).toBe(standaloneToAccount);
  });

  it("prefers provided defaultAccount and defaultParentAccount over id lookups for the to side", () => {
    const explicitAccount = account("explicit-to");
    const explicitParent = account("explicit-parent");

    const { result } = renderHook(() =>
      useSwapDefaultAccounts({
        defaultAccount: explicitAccount,
        defaultParentAccount: explicitParent,
        defaultAccountId: {
          fromAccountId: fromTokenAccount.id,
          toAccountId: standaloneToAccount.id,
        },
        defaultParentAccountId: toParentAccount.id,
      }),
    );

    expect(result.current.rawToAccountId).toBe(standaloneToAccount.id);
    expect(result.current.resolvedDefaultToAccount).toBe(explicitAccount);
    expect(result.current.resolvedDefaultToParentAccount).toBe(explicitParent);
    expect(result.current.resolvedDefaultFromAccount).toBe(fromTokenAccount);
  });

  it("uses defaultParentAccountId when no explicit parent account is provided", () => {
    const { result } = renderHook(() =>
      useSwapDefaultAccounts({
        defaultAccountId: standaloneToAccount.id,
        defaultParentAccountId: toParentAccount.id,
      }),
    );

    expect(result.current.resolvedDefaultToAccount).toBe(standaloneToAccount);
    expect(result.current.resolvedDefaultToParentAccount).toBe(toParentAccount);
  });

  it("keeps raw deeplink ids when no local account matches", () => {
    const { result } = renderHook(() =>
      useSwapDefaultAccounts({
        defaultAccountId: {
          fromAccountId: "unknown-from-wallet-api-id",
          toAccountId: "unknown-to-wallet-api-id",
        },
      }),
    );

    expect(result.current).toEqual({
      rawFromAccountId: "unknown-from-wallet-api-id",
      rawToAccountId: "unknown-to-wallet-api-id",
      resolvedDefaultFromAccount: undefined,
      resolvedDefaultFromParentAccount: undefined,
      resolvedDefaultToAccount: undefined,
      resolvedDefaultToParentAccount: undefined,
    });
  });

  it("returns empty derivation for null state", () => {
    const { result } = renderHook(() => useSwapDefaultAccounts(null));

    expect(result.current).toEqual({
      rawFromAccountId: undefined,
      rawToAccountId: undefined,
      resolvedDefaultFromAccount: undefined,
      resolvedDefaultFromParentAccount: undefined,
      resolvedDefaultToAccount: undefined,
      resolvedDefaultToParentAccount: undefined,
    });
  });
});
