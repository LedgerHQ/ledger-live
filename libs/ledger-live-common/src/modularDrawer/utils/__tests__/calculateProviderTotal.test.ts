import { calculateProviderTotals } from "../calculateProviderTotal";
import { createFixtureCryptoCurrency } from "../../../mock/fixtures/cryptoCurrencies";
import { genAccount } from "../../../mock/account";
import BigNumber from "bignumber.js";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

describe("calculateProviderTotals", () => {
  const mockBTCCurrency = createFixtureCryptoCurrency("bitcoin");
  const mockETHCurrency = createFixtureCryptoCurrency("ethereum");

  const mockBTCAccount = genAccount("btc-account", { currency: mockBTCCurrency });
  const mockUSDCAccount = genAccount("usdc-account", { currency: mockETHCurrency });
  const mockBscUSDCAccount = genAccount("bsc-usdc-account", { currency: mockETHCurrency });

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
        accounts: [mockBTCAccount], // Non-empty accounts array
        referenceCurrency: mockBTCCurrency,
      },
      [mockUSDCToken.id]: {
        totalBalance: new BigNumber(1000000), // 1 USDC
        totalFiatValue: new BigNumber(1), // $1
        accounts: [mockUSDCAccount], // Non-empty accounts array
        referenceCurrency: mockUSDCToken,
      },
    };

    const result = calculateProviderTotals(currencies, groupedAccounts);

    // BTC (magnitude 8) sets reference, USDC (magnitude 6) gets normalized
    // USDC: 1000000 * 10^(8-6) = 1000000 * 100 = 100000000
    // Total: 100000000 (BTC) + 100000000 (normalized USDC) = 200000000
    expect(result).toEqual({
      totalBalance: new BigNumber(200000000), // Combined balance after magnitude normalization
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
        accounts: [mockUSDCAccount], // Non-empty accounts array
        referenceCurrency: mockUSDCToken, // ETH USDC with 6 decimals
      },
      [mockBscUSDCToken.id]: {
        totalBalance: new BigNumber("1000000000000000000"),
        totalFiatValue: new BigNumber(1),
        accounts: [mockBscUSDCAccount], // Non-empty accounts array
        referenceCurrency: mockBscUSDCToken, // BSC USDC with 18 decimals
      },
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
        accounts: [mockUSDCAccount], // Non-empty accounts array
        referenceCurrency: mockUSDCToken,
      },
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
      },
      [mockUSDCToken.id]: {
        totalBalance: new BigNumber(1000000),
        totalFiatValue: new BigNumber(1),
        accounts: [mockUSDCAccount], // Non-empty accounts array
        referenceCurrency: mockUSDCToken,
      },
    };

    const result = calculateProviderTotals(currencies, groupedAccounts);

    expect(result).toEqual({
      totalBalance: new BigNumber(1000000), // Only USDC (non-empty accounts)
      totalFiatValue: new BigNumber(1),
      hasAccounts: true,
      referenceCurrency: mockUSDCToken,
    });
  });

  it("should normalize balances based on magnitude differences", () => {
    // Test the specific code: magnitude normalization between currencies
    const currencies = [mockUSDCToken, mockBscUSDCToken];
    const groupedAccounts = {
      [mockUSDCToken.id]: {
        totalBalance: new BigNumber(1000000), // 1 USDC with 6 decimals
        totalFiatValue: new BigNumber(1),
        accounts: [mockUSDCAccount],
        referenceCurrency: mockUSDCToken, // 6 decimals
      },
      [mockBscUSDCToken.id]: {
        totalBalance: new BigNumber("1000000000000000000"), // 1 USDC with 18 decimals
        totalFiatValue: new BigNumber(1),
        accounts: [mockBscUSDCAccount],
        referenceCurrency: mockBscUSDCToken, // 18 decimals
      },
    };

    const result = calculateProviderTotals(currencies, groupedAccounts);

    // First currency (USDC) sets reference magnitude of 6
    // Second currency (BSC USDC) has magnitude 18, so diff = 6 - 18 = -12
    // BSC balance of 1000000000000000000 shifted by -12 = 1000000
    // Total should be 1000000 + 1000000 = 2000000
    expect(result.totalBalance).toEqual(new BigNumber(2000000));
    expect(result.totalFiatValue).toEqual(new BigNumber(2));
    expect(result.hasAccounts).toBe(true);
    expect(result.referenceCurrency).toEqual(mockUSDCToken);
  });

  it("should handle magnitude normalization when referenceCurrency is set", () => {
    const currencies = [mockBscUSDCToken];
    const groupedAccounts = {
      [mockBscUSDCToken.id]: {
        totalBalance: new BigNumber("2000000000000000000"),
        totalFiatValue: new BigNumber(2),
        accounts: [mockBscUSDCAccount],
        referenceCurrency: mockBscUSDCToken,
      },
    };

    const result = calculateProviderTotals(currencies, groupedAccounts);

    expect(result.totalBalance).toEqual(new BigNumber("2000000000000000000"));
    expect(result.referenceCurrency).toEqual(mockBscUSDCToken);
  });

  it("should handle zero magnitude difference correctly", () => {
    const sameMagnitudeCurrency: CryptoOrTokenCurrency = {
      type: "TokenCurrency",
      id: "ethereum/erc20/usdc2",
      contractAddress: "0x1234567890123456789012345678901234567890",
      parentCurrency: mockETHCurrency,
      tokenType: "erc20",
      name: "USD Coin 2",
      ticker: "USDC2",
      units: [{ name: "USD Coin 2", code: "USDC2", magnitude: 6 }],
    };

    const mockSameMagnitudeAccount = genAccount("usdc2-account", { currency: mockETHCurrency });

    const currencies = [mockUSDCToken, sameMagnitudeCurrency];
    const groupedAccounts = {
      [mockUSDCToken.id]: {
        totalBalance: new BigNumber(1000000), // 1 USDC
        totalFiatValue: new BigNumber(1),
        accounts: [mockUSDCAccount],
        referenceCurrency: mockUSDCToken, // 6 decimals
      },
      [sameMagnitudeCurrency.id]: {
        totalBalance: new BigNumber(2000000), // 2 USDC2
        totalFiatValue: new BigNumber(2),
        accounts: [mockSameMagnitudeAccount],
        referenceCurrency: sameMagnitudeCurrency, // 6 decimals
      },
    };

    const result = calculateProviderTotals(currencies, groupedAccounts);

    // Both have magnitude 6, so diff = 6 - 6 = 0
    // No shifting needed, simple addition: 1000000 + 2000000 = 3000000
    expect(result.totalBalance).toEqual(new BigNumber(3000000));
    expect(result.totalFiatValue).toEqual(new BigNumber(3));
  });
});
