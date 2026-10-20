import { BigNumber } from "bignumber.js";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { maticEth, usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Currency } from "@domain/entity-currency";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { buildAccountAssets } from "../buildAccountAssets";

const PRICES: Record<string, number> = { ETH: 2, USDC: 1, MATIC: 3 };

function calculateCountervalue(currency: Currency, value: BigNumber) {
  const price = PRICES[currency.ticker];
  return price === undefined ? undefined : value.times(price);
}

function withBalance<T extends Account | TokenAccount>(account: T, balance: number): T {
  return { ...account, balance: new BigNumber(balance), spendableBalance: new BigNumber(balance) };
}

function buildAccount(balances: { eth: number; usdc: number; matic: number }): Account {
  const root = genAccount("account-detail-assets", {
    currency: getCryptoCurrencyById("ethereum"),
    subAccountsCount: 0,
  });
  return {
    ...withBalance(root, balances.eth),
    subAccounts: [
      withBalance(genTokenAccount(0, root, usdcToken), balances.usdc),
      withBalance(genTokenAccount(1, root, maticEth), balances.matic),
    ],
  };
}

const defaultOptions = {
  hideEmptyTokenAccounts: false,
  blacklistedTokenIds: new Set<string>(),
  calculateCountervalue,
};

const tickers = (assets: ReturnType<typeof buildAccountAssets>) =>
  assets.map(({ currency }) => currency.ticker);

describe("buildAccountAssets", () => {
  it("returns the coin and its tokens sorted by countervalue", () => {
    const assets = buildAccountAssets(
      buildAccount({ eth: 10, usdc: 50, matic: 5 }),
      defaultOptions,
    );

    expect(tickers(assets)).toEqual(["USDC", "ETH", "MATIC"]);
    expect(assets.map(({ countervalue }) => countervalue)).toEqual([50, 20, 15]);
  });

  it("gives each asset its own account", () => {
    const account = buildAccount({ eth: 10, usdc: 50, matic: 5 });

    const assets = buildAccountAssets(account, defaultOptions);

    expect(assets.find(({ currency }) => currency.ticker === "ETH")?.accounts).toEqual([account]);
    expect(assets.find(({ currency }) => currency.ticker === "USDC")?.accounts).toEqual([
      account.subAccounts?.[0],
    ]);
  });

  it("removes blacklisted tokens", () => {
    const assets = buildAccountAssets(buildAccount({ eth: 10, usdc: 50, matic: 5 }), {
      ...defaultOptions,
      blacklistedTokenIds: new Set([usdcToken.id]),
    });

    expect(tickers(assets)).toEqual(["ETH", "MATIC"]);
  });

  it("hides empty tokens but keeps an empty coin when empty token accounts are hidden", () => {
    const assets = buildAccountAssets(buildAccount({ eth: 0, usdc: 0, matic: 5 }), {
      ...defaultOptions,
      hideEmptyTokenAccounts: true,
    });

    expect(tickers(assets)).toEqual(["MATIC", "ETH"]);
  });

  it("keeps empty tokens when empty token accounts are shown", () => {
    const assets = buildAccountAssets(buildAccount({ eth: 10, usdc: 0, matic: 5 }), defaultOptions);

    expect(tickers(assets)).toEqual(["ETH", "MATIC", "USDC"]);
  });

  it("sorts an unknown countervalue after a known zero one", () => {
    const assets = buildAccountAssets(buildAccount({ eth: 10, usdc: 50, matic: 0 }), {
      ...defaultOptions,
      calculateCountervalue: (currency, value) =>
        currency.ticker === "USDC" ? undefined : calculateCountervalue(currency, value),
    });

    expect(tickers(assets)).toEqual(["ETH", "MATIC", "USDC"]);
    expect(assets.map(({ countervalue }) => countervalue)).toEqual([20, 0, undefined]);
  });

  it("leaves an unknown countervalue unset and sorts the asset last", () => {
    const assets = buildAccountAssets(buildAccount({ eth: 10, usdc: 50, matic: 5 }), {
      ...defaultOptions,
      calculateCountervalue: (currency, value) =>
        currency.ticker === "USDC" ? undefined : calculateCountervalue(currency, value),
    });

    expect(tickers(assets)).toEqual(["ETH", "MATIC", "USDC"]);
    expect(assets[2].countervalue).toBeUndefined();
  });
});
