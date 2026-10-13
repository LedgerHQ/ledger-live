import { renderHook } from "@tests/test-renderer";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { makeEmptyTokenAccount } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import * as walletApi from "@ledgerhq/live-common/wallet-api/converters";
import { useTranslateToSwapAccount } from "../useTranslateToSwapAccount";

const ethereum = getCryptoCurrencyById("ethereum");
const parent = { ...genAccount("eth-1", { currency: ethereum }), id: "js:2:ethereum:0x1:" };
const parentWalletApiId = walletApi.getWalletApiIdFromAccountId(parent.id);

describe("useTranslateToSwapAccount", () => {
  test("returns nothing without params", () => {
    const { result } = renderHook(() => useTranslateToSwapAccount(null));
    expect(result.current).toEqual({});
  });

  test("sends toAccountId and toTokenId for a token account", () => {
    const tokenAccount = { ...makeEmptyTokenAccount(parent, usdcToken), operationsCount: 1 };
    const { result } = renderHook(() =>
      useTranslateToSwapAccount({
        defaultAccount: tokenAccount,
        defaultParentAccount: parent,
        defaultCurrency: usdcToken,
      }),
    );

    expect(result.current.toAccountId).toBe(walletApi.getWalletApiIdFromAccountId(tokenAccount.id));
    expect(result.current.toTokenId).toBe(usdcToken.id);
  });

  test("sends the parent toAccountId with toTokenId for a token the user doesn't hold", () => {
    const { result } = renderHook(() =>
      useTranslateToSwapAccount({ defaultAccount: parent, defaultCurrency: usdcToken }),
    );

    expect(result.current.toAccountId).toBe(parentWalletApiId);
    expect(result.current.toTokenId).toBe(usdcToken.id);
  });

  test("doesn't send toTokenId for a native account on its own currency", () => {
    const { result } = renderHook(() =>
      useTranslateToSwapAccount({ defaultAccount: parent, defaultCurrency: ethereum }),
    );

    expect(result.current.toAccountId).toBe(parentWalletApiId);
    expect(result.current.toTokenId).toBeUndefined();
  });

  test("sends only toTokenId when there is no account", () => {
    const { result } = renderHook(() => useTranslateToSwapAccount({ defaultCurrency: usdcToken }));

    expect(result.current.toAccountId).toBeUndefined();
    expect(result.current.toTokenId).toBe(usdcToken.id);
  });

  test("forwards explicit account ids without an account", () => {
    const { result } = renderHook(() =>
      useTranslateToSwapAccount({ toAccountId: "to", fromAccountId: "from" }),
    );

    expect(result.current).toEqual({ toAccountId: "to", fromAccountId: "from" });
  });

  test("sends toCurrencyId for a native currency without an account", () => {
    const { result } = renderHook(() => useTranslateToSwapAccount({ defaultCurrency: ethereum }));

    expect(result.current.toCurrencyId).toBe(ethereum.id);
    expect(result.current.toTokenId).toBeUndefined();
  });

  test("forwards the optional swap params untouched", () => {
    const params = {
      fromPath: "earn",
      affiliate: "partner",
      fromTokenId: "from-token",
      toTokenId: "to-token",
      amountFrom: "1",
      toCurrencyId: "to-currency",
      fromCurrencyId: "from-currency",
    };
    const { result } = renderHook(() => useTranslateToSwapAccount(params));

    expect(result.current).toEqual(params);
  });
});
