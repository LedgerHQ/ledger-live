import { calculateProviderTotals } from "../calculateProviderTotal";
import { GroupedAccount } from "../groupAccountsByAsset";
import { createFixtureCryptoCurrency } from "../../../mock/fixtures/cryptoCurrencies";
import BigNumber from "bignumber.js";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

describe("calculateProviderTotals", () => {
  const mockBTCCurrency = createFixtureCryptoCurrency("bitcoin");
  const mockETHCurrency = createFixtureCryptoCurrency("ethereum");

  const mockUSDCToken: CryptoOrTokenCurrency = {
    type: "TokenCurrency",
    id: "ethereum/erc20/usdc",
    contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    parentCurrency: mockETHCurrency,
    tokenType: "erc20",
    name: "USD Coin",
    ticker: "USDC",
    units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
  };

  const mockBscUSDCToken: CryptoOrTokenCurrency = {
    type: "TokenCurrency",
    id: "bsc/bep20/usdc",
    contractAddress: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    parentCurrency: mockETHCurrency, // Using ETH as parent for simplicity
    tokenType: "bep20",
    name: "USD Coin (BSC)",
    ticker: "USDC",
    units: [{ name: "USD Coin", code: "USDC", magnitude: 18 }],
  };

  it("should return totals with hasAccounts false when no accounts exist", () => {
    const currencies = [mockBTCCurrency, mockUSDCToken];
    const groupedAccounts = {};

    const result = calculateProviderTotals(currencies, groupedAccounts);

    expect(result).toEqual({
      totalBalance: new BigNumber(0),
      totalFiatValue: new BigNumber(0),
      hasAccounts: false,
      referenceCurrency: null,
    });
  });

  it("should sum totals across multiple currencies", () => {
    const currencies = [mockBTCCurrency, mockUSDCToken];
    const groupedAccounts = {
      [mockBTCCurrency.id]: {
        totalBalance: new BigNumber(100000000), // 1 BTC
        totalFiatValue: new BigNumber(50000), // $50,000
        accounts: [{}], // Non-empty accounts array
        referenceCurrency: mockBTCCurrency,
      } as GroupedAccount,
      [mockUSDCToken.id]: {
        totalBalance: new BigNumber(1000000), // 1 USDC
        totalFiatValue: new BigNumber(1), // $1
        accounts: [{}], // Non-empty accounts array
        referenceCurrency: mockUSDCToken,
      } as GroupedAccount,
    };

    const result = calculateProviderTotals(currencies, groupedAccounts);

    expect(result).toEqual({
      totalBalance: new BigNumber(101000000), // Combined balance
      totalFiatValue: new BigNumber(50001), // Combined fiat value
      hasAccounts: true,
      referenceCurrency: mockBTCCurrency, // First currency with accounts
    });
  });

  it("should return referenceCurrency from first asset group with accounts", () => {
    const currencies = [mockUSDCToken, mockBscUSDCToken];
    const groupedAccounts = {
      [mockUSDCToken.id]: {
        totalBalance: new BigNumber(1000000),
        totalFiatValue: new BigNumber(1),
        accounts: [{}], // Non-empty accounts array
        referenceCurrency: mockUSDCToken, // ETH USDC with 6 decimals
      } as GroupedAccount,
      [mockBscUSDCToken.id]: {
        totalBalance: new BigNumber("1000000000000000000"),
        totalFiatValue: new BigNumber(1),
        accounts: [{}], // Non-empty accounts array
        referenceCurrency: mockBscUSDCToken, // BSC USDC with 18 decimals
      } as GroupedAccount,
    };

    const result = calculateProviderTotals(currencies, groupedAccounts);

    expect(result.referenceCurrency).toEqual(mockUSDCToken); // First currency
    expect(result.hasAccounts).toBe(true);
  });

  it("should skip currencies with no accounts", () => {
    const currencies = [mockBTCCurrency, mockUSDCToken];
    const groupedAccounts = {
      [mockUSDCToken.id]: {
        totalBalance: new BigNumber(1000000),
        totalFiatValue: new BigNumber(1),
        accounts: [{}], // Non-empty accounts array
        referenceCurrency: mockUSDCToken,
      } as GroupedAccount,
      // BTC has no entry in groupedAccounts
    };

    const result = calculateProviderTotals(currencies, groupedAccounts);

    expect(result).toEqual({
      totalBalance: new BigNumber(1000000), // Only USDC balance
      totalFiatValue: new BigNumber(1), // Only USDC fiat value
      hasAccounts: true,
      referenceCurrency: mockUSDCToken,
    });
  });

  it("should skip currencies with empty accounts array", () => {
    const currencies = [mockBTCCurrency, mockUSDCToken];
    const groupedAccounts = {
      [mockBTCCurrency.id]: {
        totalBalance: new BigNumber(100000000),
        totalFiatValue: new BigNumber(50000),
        accounts: [], // Empty accounts array should be skipped
        referenceCurrency: mockBTCCurrency,
      } as GroupedAccount,
      [mockUSDCToken.id]: {
        totalBalance: new BigNumber(1000000),
        totalFiatValue: new BigNumber(1),
        accounts: [{}], // Non-empty accounts array
        referenceCurrency: mockUSDCToken,
      } as GroupedAccount,
    };

    const result = calculateProviderTotals(currencies, groupedAccounts);

    expect(result).toEqual({
      totalBalance: new BigNumber(1000000), // Only USDC (non-empty accounts)
      totalFiatValue: new BigNumber(1),
      hasAccounts: true,
      referenceCurrency: mockUSDCToken,
    });
  });
});
