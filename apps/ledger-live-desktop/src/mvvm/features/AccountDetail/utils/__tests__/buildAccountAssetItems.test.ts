import { BigNumber } from "bignumber.js";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import type { Currency } from "@domain/entity-currency";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { maticEth, usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { buildAccountAssetItems } from "../buildAccountAssetItems";

const RATES: Record<string, number> = {
  ETH: 2,
  [usdcToken.ticker]: 1,
  [maticEth.ticker]: 10,
};

const calculateCountervalue = (currency: Currency, value: BigNumber) =>
  value.times(RATES[currency.ticker] ?? 0);

function withBalance<T extends Account | TokenAccount>(account: T, balance: number): T {
  return { ...account, balance: new BigNumber(balance), spendableBalance: new BigNumber(balance) };
}

function buildAccount(ethBalance: number, usdcBalance: number, maticBalance: number): Account {
  const eth = genAccount("assets-eth", {
    currency: getCryptoCurrencyById("ethereum"),
    subAccountsCount: 0,
  });
  return {
    ...withBalance(eth, ethBalance),
    subAccounts: [
      withBalance(genTokenAccount(0, eth, usdcToken), usdcBalance),
      withBalance(genTokenAccount(1, eth, maticEth), maticBalance),
    ],
  };
}

const defaultOptions = {
  hideEmptyTokenAccounts: false,
  blacklistedTokenIds: new Set<string>(),
  calculateCountervalue,
};

describe("buildAccountAssetItems", () => {
  it("lists the native coin and every token, sorted by value", () => {
    const items = buildAccountAssetItems(buildAccount(10, 50, 1), defaultOptions);

    expect(items.map(({ currency, value }) => [currency.id, value])).toEqual([
      [usdcToken.id, 50],
      ["ethereum", 20],
      [maticEth.id, 10],
    ]);
  });

  it("gives each row its own account and its share of the account value", () => {
    const account = buildAccount(10, 50, 1);
    const items = buildAccountAssetItems(account, defaultOptions);

    expect(items.find(({ currency }) => currency.id === "ethereum")).toMatchObject({
      accounts: [account],
      balance: 10,
      distribution: 0.25,
      isPlaceholder: false,
    });
  });

  it("removes blacklisted tokens", () => {
    const items = buildAccountAssetItems(buildAccount(10, 50, 1), {
      ...defaultOptions,
      blacklistedTokenIds: new Set([usdcToken.id]),
    });

    expect(items.map(({ currency }) => currency.id)).toEqual(["ethereum", maticEth.id]);
  });

  it("hides empty tokens when the setting is on but always keeps the native coin", () => {
    const items = buildAccountAssetItems(buildAccount(0, 0, 1), {
      ...defaultOptions,
      hideEmptyTokenAccounts: true,
    });

    expect(items.map(({ currency }) => currency.id)).toEqual([maticEth.id, "ethereum"]);
  });

  it("keeps empty tokens when the setting is off", () => {
    const items = buildAccountAssetItems(buildAccount(0, 0, 1), defaultOptions);

    expect(items.map(({ currency }) => currency.id)).toContain(usdcToken.id);
  });
});
