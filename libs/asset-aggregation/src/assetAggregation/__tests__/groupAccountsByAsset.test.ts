import { groupAccountsByAsset } from "../groupAccountsByAsset";
import { createFixtureAccount, createFixtureTokenAccount } from "./fixtures";
import { cryptocurrenciesById } from "@ledgerhq/cryptoassets";
import BigNumber from "bignumber.js";
import type { TokenAccount } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";

jest.mock("@ledgerhq/live-countervalues/logic", () => ({
  calculate: jest.fn((_state, { value }) => value),
}));

describe("groupAccountsByAsset", () => {
  const btcCurrency = cryptocurrenciesById["bitcoin"];
  const ethCurrency = cryptocurrenciesById["ethereum"];
  const cvState: CounterValuesState = { data: {}, status: {}, cache: {} };

  const usdcToken: TokenCurrency = {
    type: "TokenCurrency",
    id: "ethereum/erc20/usdc",
    contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    parentCurrency: ethCurrency,
    tokenType: "erc20",
    name: "USD Coin",
    ticker: "USDC",
    units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
  };

  const btcAccount = {
    ...createFixtureAccount("01", btcCurrency),
    balance: new BigNumber(100000000),
  };

  const usdcAccount = {
    ...createFixtureTokenAccount("01", usdcToken),
    balance: new BigNumber(1000000),
  };

  it("should group accounts by asset ID and aggregate balances", () => {
    const result = groupAccountsByAsset([btcAccount, usdcAccount], cvState, ethCurrency);

    expect(result[btcCurrency.id].totalBalance).toEqual(new BigNumber(100000000));
    expect(result[btcCurrency.id].accounts).toHaveLength(1);
    expect(result[usdcToken.id].totalBalance).toEqual(new BigNumber(1000000));
    expect(result[usdcToken.id].accounts).toHaveLength(1);
  });

  it("should aggregate multiple accounts with the same asset", () => {
    const secondBtc = {
      ...createFixtureAccount("02", btcCurrency),
      balance: new BigNumber(50000000),
    };

    const result = groupAccountsByAsset([btcAccount, secondBtc], cvState, ethCurrency);

    expect(result[btcCurrency.id].totalBalance).toEqual(new BigNumber(150000000));
    expect(result[btcCurrency.id].accounts).toHaveLength(2);
  });

  it("should handle empty accounts array", () => {
    expect(groupAccountsByAsset([], cvState, ethCurrency)).toEqual({});
  });

  it("should handle accounts with zero balance", () => {
    const zeroBtc = { ...createFixtureAccount("03", btcCurrency), balance: new BigNumber(0) };
    const result = groupAccountsByAsset([zeroBtc], cvState, ethCurrency);

    expect(result[btcCurrency.id].totalBalance).toEqual(new BigNumber(0));
  });

  it("should set referenceCurrency to the first currency encountered", () => {
    const result = groupAccountsByAsset([btcAccount, usdcAccount], cvState, ethCurrency);

    expect(result[btcCurrency.id].referenceCurrency).toEqual(btcCurrency);
    expect(result[usdcToken.id].referenceCurrency).toEqual(usdcToken);
  });

  it("should normalize balances when tokens have different magnitudes in the same group", () => {
    const ethUsdc: TokenAccount = {
      ...createFixtureTokenAccount("10", usdcToken),
      balance: new BigNumber(1000000),
    };

    const bscUsdcToken: TokenCurrency = {
      ...usdcToken,
      units: [{ name: "USD Coin", code: "USDC", magnitude: 18 }],
    };
    const bscUsdc: TokenAccount = {
      ...createFixtureTokenAccount("11", bscUsdcToken),
      token: bscUsdcToken,
      balance: new BigNumber("1000000000000000000"),
    };

    const result = groupAccountsByAsset([ethUsdc, bscUsdc], cvState, ethCurrency);

    const group = result[usdcToken.id];
    expect(group.accounts).toHaveLength(2);
    // BSC balance normalized from magnitude 18 to 6: shift by -12
    expect(group.totalBalance).toEqual(new BigNumber(2000000));
  });
});
