import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { buildSwapNavigationState } from "../swapNavigation";

const bitcoin = getCryptoCurrencyById("bitcoin");
const ethereum = getCryptoCurrencyById("ethereum");

describe("buildSwapNavigationState", () => {
  it("sets toCurrencyId for a crypto currency", () => {
    const state = buildSwapNavigationState({ defaultCurrency: bitcoin, fromPath: "/earn" });

    expect(state.defaultCurrency).toEqual({ toCurrencyId: bitcoin.id });
    expect(state.from).toBe("/earn");
    expect(state.defaultAmountFrom).toBe("0");
  });

  it("does not set defaultToken for a crypto currency", () => {
    const state = buildSwapNavigationState({ defaultCurrency: bitcoin, fromPath: "/earn" });

    expect(state.defaultToken).toBeUndefined();
  });

  it("sets toCurrencyId and toTokenId for a token currency without account", () => {
    const state = buildSwapNavigationState({ defaultCurrency: usdcToken, fromPath: "/earn" });

    expect(state.defaultCurrency).toEqual({ toCurrencyId: usdcToken.id });
    expect(state.defaultToken).toEqual({ toTokenId: usdcToken.id });
  });

  it("does not set toTokenId for a token currency when an account is provided", () => {
    const ethAccount = genAccount("eth-1", { currency: ethereum });
    const tokenAccount = genTokenAccount(0, ethAccount, usdcToken);

    const state = buildSwapNavigationState({
      defaultCurrency: usdcToken,
      fromPath: "/earn",
      account: tokenAccount,
      parentAccount: ethAccount,
    });

    expect(state.defaultToken).toBeUndefined();
  });

  it("includes defaultAccountId when account is provided", () => {
    const account = genAccount("btc-1", { currency: bitcoin });

    const state = buildSwapNavigationState({
      defaultCurrency: bitcoin,
      fromPath: "/earn",
      account,
    });

    expect(state.defaultAccountId).toBe(account.id);
    expect(state.defaultParentAccountId).toBeUndefined();
  });

  it("includes defaultParentAccountId for a token account", () => {
    const ethAccount = genAccount("eth-1", { currency: ethereum });
    const tokenAccount = genTokenAccount(0, ethAccount, usdcToken);

    const state = buildSwapNavigationState({
      defaultCurrency: usdcToken,
      fromPath: "/earn",
      account: tokenAccount,
      parentAccount: ethAccount,
    });

    expect(state.defaultAccountId).toBe(tokenAccount.id);
    expect(state.defaultParentAccountId).toBe(ethAccount.id);
  });

  it("never passes a raw currency object as defaultCurrency", () => {
    const state = buildSwapNavigationState({ defaultCurrency: bitcoin, fromPath: "/earn" });

    expect(state.defaultCurrency).toHaveProperty("toCurrencyId");
    expect(state.defaultCurrency).not.toHaveProperty("id");
    expect(state.defaultCurrency).not.toHaveProperty("type");
  });
});
