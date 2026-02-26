import { calculateProviderTotals } from "../calculateProviderTotals";
import { createFixtureAccount } from "./fixtures";
import { cryptocurrenciesById } from "@ledgerhq/cryptoassets";
import BigNumber from "bignumber.js";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";

describe("calculateProviderTotals", () => {
  const btcCurrency = cryptocurrenciesById["bitcoin"];
  const ethCurrency = cryptocurrenciesById["ethereum"];

  const btcAccount = createFixtureAccount("01", btcCurrency);
  const usdcAccount = createFixtureAccount("02", ethCurrency);
  const bscUsdcAccount = createFixtureAccount("03", ethCurrency);

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

  const bscUsdcToken: TokenCurrency = {
    type: "TokenCurrency",
    id: "bsc/bep20/usdc",
    contractAddress: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    parentCurrency: ethCurrency,
    tokenType: "bep20",
    name: "USD Coin (BSC)",
    ticker: "USDC",
    units: [{ name: "USD Coin", code: "USDC", magnitude: 18 }],
  };

  it("should return hasAccounts false when no accounts exist", () => {
    const result = calculateProviderTotals([btcCurrency, usdcToken], {});

    expect(result.hasAccounts).toBe(false);
    expect(result.totalBalance).toEqual(new BigNumber(0));
    expect(result.referenceCurrency).toBeNull();
  });

  it("should sum totals across multiple currencies", () => {
    const result = calculateProviderTotals([btcCurrency, usdcToken], {
      [btcCurrency.id]: {
        totalBalance: new BigNumber(100000000),
        totalFiatValue: new BigNumber(50000),
        accounts: [btcAccount],
        referenceCurrency: btcCurrency,
      },
      [usdcToken.id]: {
        totalBalance: new BigNumber(1000000),
        totalFiatValue: new BigNumber(1),
        accounts: [usdcAccount],
        referenceCurrency: usdcToken,
      },
    });

    expect(result.hasAccounts).toBe(true);
    expect(result.totalFiatValue).toEqual(new BigNumber(50001));
    expect(result.referenceCurrency).toEqual(btcCurrency);
  });

  it("should skip currencies with no or empty accounts", () => {
    const result = calculateProviderTotals([btcCurrency, usdcToken], {
      [btcCurrency.id]: {
        totalBalance: new BigNumber(100000000),
        totalFiatValue: new BigNumber(50000),
        accounts: [],
        referenceCurrency: btcCurrency,
      },
      [usdcToken.id]: {
        totalBalance: new BigNumber(1000000),
        totalFiatValue: new BigNumber(1),
        accounts: [usdcAccount],
        referenceCurrency: usdcToken,
      },
    });

    expect(result.totalBalance).toEqual(new BigNumber(1000000));
    expect(result.referenceCurrency).toEqual(usdcToken);
  });

  it("should normalize balances based on magnitude differences", () => {
    const result = calculateProviderTotals([usdcToken, bscUsdcToken], {
      [usdcToken.id]: {
        totalBalance: new BigNumber(1000000),
        totalFiatValue: new BigNumber(1),
        accounts: [usdcAccount],
        referenceCurrency: usdcToken,
      },
      [bscUsdcToken.id]: {
        totalBalance: new BigNumber("1000000000000000000"),
        totalFiatValue: new BigNumber(1),
        accounts: [bscUsdcAccount],
        referenceCurrency: bscUsdcToken,
      },
    });

    // magnitude diff = 6 - 18 = -12, so BSC balance shifts to 1000000
    expect(result.totalBalance).toEqual(new BigNumber(2000000));
    expect(result.totalFiatValue).toEqual(new BigNumber(2));
    expect(result.referenceCurrency).toEqual(usdcToken);
  });
});
