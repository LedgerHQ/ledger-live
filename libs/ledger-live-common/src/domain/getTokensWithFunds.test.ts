import { genAccount } from "@ledgerhq/coin-framework/lib/mocks/account";
import { getCryptoCurrencyById } from "../currencies/index";
import { Account } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import { getTokensWithFunds } from "./getTokensWithFunds";
import { setupMockCryptoAssetsStore } from "../test-helpers/cryptoAssetsStore";

// Setup mock store for unit tests
setupMockCryptoAssetsStore();

const ETH = getCryptoCurrencyById("ethereum");

// Create mock tokens for tests
const ZRX_TOKEN: TokenCurrency = {
  type: "TokenCurrency",
  id: "ethereum/erc20/0x_project",
  contractAddress: "0xE41d2489571d322189246DaFA5ebDe1F4699F498",
  parentCurrency: ETH,
  tokenType: "erc20",
  name: "0x Project",
  ticker: "ZRX",
  delisted: false,
  disableCountervalue: false,
  units: [{ name: "ZRX", code: "ZRX", magnitude: 18 }],
};

const REP_TOKEN: TokenCurrency = {
  type: "TokenCurrency",
  id: "ethereum/erc20/augur",
  contractAddress: "0x1985365e9f78359a9B6AD760e32412f4a445E862",
  parentCurrency: ETH,
  tokenType: "erc20",
  name: "Augur",
  ticker: "REP",
  delisted: false,
  disableCountervalue: false,
  units: [{ name: "REP", code: "REP", magnitude: 18 }],
};

const mockedAccounts: Account[] = [
  genAccount("mocked-account-2", {
    currency: ETH,
    tokensData: [ZRX_TOKEN, REP_TOKEN],
  }),
];

describe("getTokensWithFunds", () => {
  it("should return empty array if no accounts", () => {
    const result = getTokensWithFunds([]);
    expect(result).toEqual([]);
  });

  it("should return array with accounts with funds", () => {
    const account = mockedAccounts[0];
    const result = getTokensWithFunds(mockedAccounts);

    expect(account.balance).toBeTruthy();
    expect(account.balance instanceof BigNumber).toBe(true);
    expect(account.balance.gt(0)).toBe(true);

    expect(account.subAccounts).toBeDefined();
    expect(account.subAccounts?.length).toBe(2);

    const [zrxAccount, repAccount] = account.subAccounts || [];

    expect(zrxAccount.balance).toBeTruthy();
    expect(zrxAccount.balance instanceof BigNumber).toBe(true);
    expect(zrxAccount.balance.gt(0)).toBe(true);

    expect(repAccount.balance).toBeTruthy();
    expect(repAccount.balance instanceof BigNumber).toBe(true);
    expect(repAccount.balance.gt(0)).toBe(true);

    expect(result).toEqual(["ETH on Ethereum", "ZRX on Ethereum", "REP on Ethereum"]);
  });

  it("should return array with accounts with funds", () => {
    const account = mockedAccounts[0];

    expect(account.balance).toBeTruthy();
    expect(account.balance instanceof BigNumber).toBe(true);
    expect(account.balance.gt(0)).toBe(true);

    expect(account.subAccounts).toBeDefined();
    expect(account.subAccounts?.length).toBe(2);

    const [zrxAccount, repAccount] = account.subAccounts || [];

    const emptyRepAccount = { ...repAccount, balance: new BigNumber(0) };

    expect(zrxAccount.balance).toBeTruthy();
    expect(zrxAccount.balance instanceof BigNumber).toBe(true);
    expect(zrxAccount.balance.gt(0)).toBe(true);

    expect(emptyRepAccount.balance).toBeTruthy();
    expect(emptyRepAccount.balance instanceof BigNumber).toBe(true);
    expect(emptyRepAccount.balance.gt(0)).toBe(false);

    const accounts = { ...account, subAccounts: [zrxAccount, emptyRepAccount] };

    const result = getTokensWithFunds([accounts]);

    expect(result).toEqual(["ETH on Ethereum", "ZRX on Ethereum"]);
  });

  it("should return array with accounts with funds without duplication", () => {
    const account = mockedAccounts[0];

    expect(account.balance).toBeTruthy();
    expect(account.balance instanceof BigNumber).toBe(true);
    expect(account.balance.gt(0)).toBe(true);

    expect(account.subAccounts).toBeDefined();
    expect(account.subAccounts?.length).toBe(2);

    const [zrxAccount, repAccount] = account.subAccounts || [];

    const accounts = { ...account, subAccounts: [zrxAccount, repAccount, repAccount] };

    expect(accounts.subAccounts.length).toBe(3);

    const result = getTokensWithFunds([accounts]);

    expect(result).toEqual(["ETH on Ethereum", "ZRX on Ethereum", "REP on Ethereum"]);
  });
});
