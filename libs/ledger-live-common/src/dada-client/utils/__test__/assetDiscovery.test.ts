import { selectTopStocks, selectTopAssetsByCategory } from "../assetDiscovery";
import type { AssetsDataWithPagination } from "../../state-manager/types";

function makeData(ids: string[]): AssetsDataWithPagination {
  return {
    currenciesOrder: { key: "marketCap", order: "desc", metaCurrencyIds: ids },
    cryptoAssets: Object.fromEntries(
      ids.map(id => [id, { id, name: id, ticker: id.toUpperCase(), assetsIds: { ethereum: id } }]),
    ),
    cryptoOrTokenCurrencies: Object.fromEntries(
      ids.map(id => [id, { id, type: "CryptoCurrency", name: id }]),
    ),
    markets: Object.fromEntries(ids.map((id, i) => [id, { id, marketCapRank: i + 1 }])),
    networks: {},
    interestRates: {},
    pagination: {},
  } as unknown as AssetsDataWithPagination;
}

describe("selectTopStocks", () => {
  it("returns up to `limit` stocks in market-cap order", () => {
    const stocks = selectTopStocks(makeData(["aapl", "tsla", "msft", "amzn"]), 2);

    expect(stocks).toHaveLength(2);
    expect(stocks.map(s => s.ticker)).toEqual(["AAPL", "TSLA"]);
    expect(stocks[0]).toMatchObject({ id: "aapl", navigationId: "aapl", ledgerId: "aapl" });
  });

  it("skips meta-currencies without a resolvable ledger id", () => {
    const data = makeData(["aapl"]);
    data.cryptoAssets["aapl"].assetsIds = {};
    data.cryptoOrTokenCurrencies = {};

    expect(selectTopStocks(data, 5)).toHaveLength(0);
  });
});

describe("selectTopAssetsByCategory", () => {
  it("splits cryptos and stablecoins by ticker, respecting the per-category caps", () => {
    const data = makeData(["btc", "eth", "sol", "ada", "usdt", "usdc"]);

    const { cryptos, stablecoins } = selectTopAssetsByCategory(data, new Set(["USDT", "USDC"]), {
      maxCryptos: 3,
      maxStablecoins: 2,
    });

    expect(cryptos.map(c => c.meta.ticker)).toEqual(["BTC", "ETH", "SOL"]);
    expect(stablecoins.map(s => s.meta.ticker)).toEqual(["USDT", "USDC"]);
  });

  it("attaches the market entry for each selected asset", () => {
    const { cryptos } = selectTopAssetsByCategory(makeData(["btc"]), new Set(), {
      maxCryptos: 1,
      maxStablecoins: 0,
    });

    expect(cryptos[0].market).toMatchObject({ id: "btc", marketCapRank: 1 });
  });
});
