import { BigNumber } from "bignumber.js";
import { genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { ETH_ACCOUNT, ETH_ACCOUNT_WITH_USDC } from "LLD/features/__mocks__/accounts.mock";
import { ethereumCurrency } from "LLD/features/__mocks__/useSelectAssetFlow.mock";
import { getAccountAssetsCurrencies } from "../getAccountAssetsCurrencies";

describe("getAccountAssetsCurrencies", () => {
  it("returns the token currency for TokenAccount rows", () => {
    const tokenAccount = genTokenAccount(0, ETH_ACCOUNT, usdcToken);

    expect(getAccountAssetsCurrencies(tokenAccount)).toEqual([usdcToken]);
  });

  it("returns the main currency for accounts without sub-accounts", () => {
    expect(getAccountAssetsCurrencies(ETH_ACCOUNT)).toEqual([ethereumCurrency]);
  });

  it("returns main and sub-account tokens when the main balance is non-zero", () => {
    const tokenAccount = ETH_ACCOUNT_WITH_USDC.subAccounts![0];

    expect(getAccountAssetsCurrencies(ETH_ACCOUNT_WITH_USDC)).toEqual([
      ethereumCurrency,
      tokenAccount.token,
    ]);
  });

  it("omits the main currency when balance is zero but sub-accounts exist", () => {
    const parent = {
      ...ETH_ACCOUNT_WITH_USDC,
      balance: new BigNumber(0),
    };

    expect(getAccountAssetsCurrencies(parent)).toEqual([parent.subAccounts![0].token]);
  });
});
