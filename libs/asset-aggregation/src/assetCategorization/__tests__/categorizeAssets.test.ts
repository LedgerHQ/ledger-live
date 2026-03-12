import { categorizeAssets } from "../categorizeAssets";
import { btc, eth, usdtEth, usdcEth, makeDistItem, mockAccounts } from "./fixtures";

describe("categorizeAssets", () => {
  const stablecoinTickers = new Set(["USDT", "USDC"]);

  const distribution = [
    makeDistItem(btc, { distribution: 0.6, amount: 1e8, countervalue: 60000 }),
    makeDistItem(eth, { distribution: 0.2, amount: 1e18, countervalue: 20000 }),
    makeDistItem(usdtEth, { distribution: 0.12, amount: 12e9, countervalue: 12000 }),
    makeDistItem(usdcEth, { distribution: 0.08, amount: 8e9, countervalue: 8000 }),
  ];

  it("should split distribution into cryptos and stablecoins", () => {
    const result = categorizeAssets(distribution, stablecoinTickers);

    expect(result.cryptos).toHaveLength(2);
    expect(result.stablecoins).toHaveLength(2);
  });

  it("should categorize BTC and ETH as cryptos", () => {
    const tickers = categorizeAssets(distribution, stablecoinTickers).cryptos.map(
      i => i.currency.ticker,
    );
    expect(tickers).toEqual(expect.arrayContaining(["BTC", "ETH"]));
  });

  it("should categorize USDT and USDC as stablecoins", () => {
    const tickers = categorizeAssets(distribution, stablecoinTickers).stablecoins.map(
      i => i.currency.ticker,
    );
    expect(tickers).toEqual(expect.arrayContaining(["USDT", "USDC"]));
  });

  it("should map balance, value, and distribution from input", () => {
    const btcItem = categorizeAssets(distribution, stablecoinTickers).cryptos.find(
      i => i.currency.id === btc.id,
    );

    expect(btcItem?.balance).toBe(1e8);
    expect(btcItem?.value).toBe(60000);
    expect(btcItem?.distribution).toBe(0.6);
  });

  it("should handle empty distribution", () => {
    const result = categorizeAssets([], stablecoinTickers);
    expect(result.cryptos).toHaveLength(0);
    expect(result.stablecoins).toHaveLength(0);
  });

  it("should default undefined countervalue to 0", () => {
    const item = [makeDistItem(btc, { distribution: 1, amount: 1e8, countervalue: undefined })];
    expect(categorizeAssets(item, stablecoinTickers).cryptos[0].value).toBe(0);
  });

  it("should preserve accounts for single-chain assets", () => {
    const accounts = mockAccounts("acc-1");
    const item = [
      makeDistItem(btc, { distribution: 1, amount: 1e8, countervalue: 60000, accounts }),
    ];
    expect(categorizeAssets(item, stablecoinTickers).cryptos[0].accounts).toEqual(accounts);
  });

  it("should classify everything as crypto when stablecoinTickers is empty", () => {
    const result = categorizeAssets(distribution, new Set());
    expect(result.cryptos).toHaveLength(4);
    expect(result.stablecoins).toHaveLength(0);
  });

  it("should match stablecoin tickers case-insensitively", () => {
    const mixedCaseTickers = new Set(["usdt", "Usdc"]);
    const result = categorizeAssets(distribution, mixedCaseTickers);

    expect(result.stablecoins).toHaveLength(2);
    expect(result.stablecoins.map(i => i.currency.ticker)).toEqual(
      expect.arrayContaining(["USDT", "USDC"]),
    );
  });
});
