import BigNumber from "bignumber.js";
import { cryptocurrenciesById } from "@ledgerhq/cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import {
  type CalculateCountervalue,
  computeAggregatedAccountsData,
} from "../computeAggregatedAccountsData";
import { createFixtureAccount, createFixtureTokenAccount } from "./fixtures";
import { makeToken } from "../../assetCategorization/__tests__/fixtures";

const bitcoin = cryptocurrenciesById["bitcoin"];
const ethereum = cryptocurrenciesById["ethereum"];

const BTC_ACCOUNT = createFixtureAccount("btc1", bitcoin);
const ETH_ACCOUNT = createFixtureAccount("eth1", ethereum);
const usdcToken = makeToken("ethereum/erc20/usdc", "USDC", "USD Coin");

const calculateCountervalue: jest.Mock<ReturnType<CalculateCountervalue>> = jest.fn(
  (_from, value: BigNumber) => value.times(2),
);

function withBalance<T extends Account>(account: T, balance: BigNumber): T {
  return { ...account, balance };
}

beforeEach(() => {
  calculateCountervalue.mockReset();
  calculateCountervalue.mockImplementation((_from, value: BigNumber) => value.times(2));
});

describe("computeAggregatedAccountsData", () => {
  it("returns an empty map when accounts are empty", () => {
    const map = computeAggregatedAccountsData([], calculateCountervalue);
    expect(map.size).toBe(0);
  });

  it("ignores non-main accounts (TokenAccount rows)", () => {
    const usdc = createFixtureTokenAccount("usdc1", usdcToken);
    const map = computeAggregatedAccountsData([usdc], calculateCountervalue);
    expect(map.size).toBe(0);
  });

  it("computes countervalue for a main account with no sub-accounts", () => {
    const account = withBalance(BTC_ACCOUNT, new BigNumber(100));
    const map = computeAggregatedAccountsData([account], calculateCountervalue);
    expect(map.get(account.id)?.countervalue.toString()).toBe("200");
    expect(map.get(account.id)?.subAccountsCount).toBe(0);
  });

  it("sums main account and sub-account countervalues", () => {
    const usdc = createFixtureTokenAccount("usdc1", usdcToken);
    const parent: Account = {
      ...ETH_ACCOUNT,
      balance: new BigNumber(100),
      subAccounts: [{ ...usdc, balance: new BigNumber(50) }],
    };

    const map = computeAggregatedAccountsData([parent], calculateCountervalue);
    expect(map.get(parent.id)?.countervalue.toString()).toBe("300");
    expect(map.get(parent.id)?.subAccountsCount).toBe(1);
  });

  it("includes sub-accounts even when main balance is zero", () => {
    const usdc = createFixtureTokenAccount("usdc1", usdcToken);
    const parent: Account = {
      ...ETH_ACCOUNT,
      balance: new BigNumber(0),
      subAccounts: [{ ...usdc, balance: new BigNumber(50) }],
    };

    const map = computeAggregatedAccountsData([parent], calculateCountervalue);
    expect(map.get(parent.id)?.countervalue.toString()).toBe("100");
    expect(map.get(parent.id)?.subAccountsCount).toBe(1);
  });

  it("treats null/undefined countervalues as zero", () => {
    calculateCountervalue.mockReturnValueOnce(null).mockReturnValueOnce(undefined);
    const usdc = createFixtureTokenAccount("usdc1", usdcToken);
    const parent: Account = {
      ...ETH_ACCOUNT,
      balance: new BigNumber(100),
      subAccounts: [{ ...usdc, balance: new BigNumber(50) }],
    };

    const map = computeAggregatedAccountsData([parent], calculateCountervalue);
    expect(map.get(parent.id)?.countervalue.toString()).toBe("0");
  });
});
