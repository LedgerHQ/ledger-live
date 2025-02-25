import { genAccount } from "@ledgerhq/coin-framework/lib/mocks/account";
import { getTokensWithFunds } from "../getTokensWithFunds";
import { Account } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import BigNumber from "bignumber.js";

const ETH = getCryptoCurrencyById("ethereum");

const mockedAccounts: Account[] = [
  genAccount("mocked-account-2", {
    currency: ETH,
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
