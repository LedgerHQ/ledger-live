import { BigNumber } from "bignumber.js";
import type { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import {
  BTC_ACCOUNT,
  ETH_ACCOUNT,
  ETH_ACCOUNT_WITH_USDC,
} from "LLD/features/__mocks__/accounts.mock";
import {
  type CalculateCountervalue,
  computeAggregatedAccountsData,
  computeBalanceSortCountervalueByAccountId,
} from "../aggregateAccounts";

const calculateCountervalue: jest.Mock<ReturnType<CalculateCountervalue>> = jest.fn(
  (_from, value: BigNumber) => value.times(2),
);

beforeEach(() => {
  calculateCountervalue.mockReset();
  calculateCountervalue.mockImplementation((_from, value: BigNumber) => value.times(2));
});

function withBalance<T extends AccountLike>(account: T, balance: BigNumber): T {
  return { ...account, balance };
}

function firstSubAccount(account: Account): TokenAccount {
  const sub = account.subAccounts?.[0];
  if (!sub) throw new Error("Fixture must expose a sub-account");
  return sub;
}

describe("computeAggregatedAccountsData", () => {
  it("returns an empty map when rows are empty", () => {
    const map = computeAggregatedAccountsData([], calculateCountervalue);
    expect(map.size).toBe(0);
  });

  it("ignores rows that are not main accounts", () => {
    const tokenAccount = firstSubAccount(ETH_ACCOUNT_WITH_USDC);
    const map = computeAggregatedAccountsData([tokenAccount], calculateCountervalue);
    expect(map.size).toBe(0);
  });

  it("counts a main account with non-zero balance as 1 asset", () => {
    const account = withBalance(BTC_ACCOUNT, new BigNumber(100));
    const map = computeAggregatedAccountsData([account], calculateCountervalue);
    expect(map.get(account.id)?.count).toBe(1);
    expect(map.get(account.id)?.countervalue.toString()).toBe("200");
  });

  it("excludes the main account from count and countervalue when its balance is zero", () => {
    const account = withBalance(BTC_ACCOUNT, new BigNumber(0));
    const map = computeAggregatedAccountsData([account], calculateCountervalue);
    expect(map.get(account.id)?.count).toBe(0);
    expect(map.get(account.id)?.countervalue.toString()).toBe("0");
  });

  it("always includes sub-accounts in count and countervalue, regardless of their balance", () => {
    const usdc = firstSubAccount(ETH_ACCOUNT_WITH_USDC);
    const parent: Account = {
      ...ETH_ACCOUNT_WITH_USDC,
      balance: new BigNumber(0),
      subAccounts: [
        { ...usdc, balance: new BigNumber(0) },
        { ...usdc, id: `${usdc.id}-2`, balance: new BigNumber(50) },
      ],
    };

    const map = computeAggregatedAccountsData([parent], calculateCountervalue);
    expect(map.get(parent.id)?.count).toBe(2);
    expect(map.get(parent.id)?.countervalue.toString()).toBe("100");
  });

  it("aggregates main account + sub-accounts when all have non-zero balances", () => {
    const usdc = firstSubAccount(ETH_ACCOUNT_WITH_USDC);
    const parent: Account = {
      ...ETH_ACCOUNT_WITH_USDC,
      balance: new BigNumber(100),
      subAccounts: [{ ...usdc, balance: new BigNumber(50) }],
    };

    const map = computeAggregatedAccountsData([parent], calculateCountervalue);
    expect(map.get(parent.id)?.count).toBe(2);
    expect(map.get(parent.id)?.countervalue.toString()).toBe("300");
  });

  it("treats null/undefined countervalues as zero", () => {
    calculateCountervalue.mockReturnValueOnce(null).mockReturnValueOnce(undefined);
    const account = withBalance(BTC_ACCOUNT, new BigNumber(100));
    const map = computeAggregatedAccountsData([account], calculateCountervalue);
    expect(map.get(account.id)?.count).toBe(1);
    expect(map.get(account.id)?.countervalue.toString()).toBe("0");
  });
});

describe("computeBalanceSortCountervalueByAccountId", () => {
  it("returns per-account countervalues", () => {
    const a = withBalance(BTC_ACCOUNT, new BigNumber(100));
    const b = withBalance(ETH_ACCOUNT, new BigNumber(250));

    const map = computeBalanceSortCountervalueByAccountId([a, b], calculateCountervalue);

    expect(map.get(a.id)?.toString()).toBe("200");
    expect(map.get(b.id)?.toString()).toBe("500");
  });

  it("defaults to zero when countervalue is not available", () => {
    calculateCountervalue.mockReturnValueOnce(null);
    const account = withBalance(BTC_ACCOUNT, new BigNumber(100));
    const map = computeBalanceSortCountervalueByAccountId([account], calculateCountervalue);
    expect(map.get(account.id)?.toString()).toBe("0");
  });
});
