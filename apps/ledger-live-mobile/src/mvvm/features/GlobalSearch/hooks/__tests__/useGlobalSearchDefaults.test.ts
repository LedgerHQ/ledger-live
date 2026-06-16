import { renderHook } from "@tests/test-renderer";
import { useAssetsData } from "@ledgerhq/live-common/dada-client/hooks/useAssetsData";
import { useStocksData } from "@ledgerhq/live-common/dada-client/hooks/useStocksData";
import { useStablecoinTickers } from "@ledgerhq/live-common/dada-client/hooks/useStablecoinTickers";
import { selectCurrencyForMetaId } from "@ledgerhq/live-common/dada-client/utils/currencySelection";
import { useGlobalSearchDefaults } from "../useGlobalSearchDefaults";

jest.mock("@ledgerhq/live-common/dada-client/hooks/useAssetsData");
jest.mock("@ledgerhq/live-common/dada-client/hooks/useStocksData");
jest.mock("@ledgerhq/live-common/dada-client/hooks/useStablecoinTickers");
jest.mock("@ledgerhq/live-common/dada-client/utils/currencySelection");
jest.mock("@ledgerhq/live-common/counterValues/hooks/useUsdToFiatRate", () => ({
  useUsdToFiatRate: () => ({ rate: 1, status: "ready" }),
}));

const mockedAssets = jest.mocked(useAssetsData);
const mockedStocks = jest.mocked(useStocksData);
const mockedStablecoinTickers = jest.mocked(useStablecoinTickers);
const mockedSelectCurrency = jest.mocked(selectCurrencyForMetaId);

const makeMeta = (id: string, ticker: string) => ({
  id,
  name: ticker,
  ticker,
  assetsIds: { ethereum: `${id}-ledger` },
});

const makeMarket = (id: string, rank: number) => ({
  id,
  name: id,
  ticker: id.toUpperCase(),
  ledgerIds: [`${id}-ledger`],
  price: 100 + rank,
  marketCap: 1_000_000 - rank,
  marketCapRank: rank,
  priceChangePercentage24h: rank,
});

// Cryptos and stablecoins (USDT/USDC) interleaved, ordered by market cap.
const assetIds = ["btc", "usdt", "eth", "usdc", "sol", "ada"];
// 22 stocks (more than the 20 cap).
const stockIds = Array.from({ length: 22 }, (_, i) => `stock${i}`);

function buildDadaData(ids: string[]) {
  return {
    currenciesOrder: { metaCurrencyIds: ids, key: "marketCap", order: "desc" },
    cryptoAssets: Object.fromEntries(ids.map(id => [id, makeMeta(id, id.toUpperCase())])),
    markets: Object.fromEntries(ids.map((id, i) => [id, makeMarket(id, i + 1)])),
  };
}

describe("useGlobalSearchDefaults", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedSelectCurrency.mockImplementation((metaId: string) => ({ id: metaId }) as never);
    mockedStablecoinTickers.mockReturnValue({
      tickers: new Set(["USDT", "USDC"]),
      isLoading: false,
      isError: false,
    } as never);
    mockedAssets.mockReturnValue({ data: buildDadaData(assetIds), isLoading: false } as never);
    mockedStocks.mockReturnValue({ data: buildDadaData(stockIds), isLoading: false } as never);
  });

  it("returns the top 3 cryptos and 20 stocks", () => {
    const { result } = renderHook(() => useGlobalSearchDefaults(true));
    const { cryptos, stocks } = result.current.defaultSections;

    expect(cryptos).toHaveLength(3);
    expect(stocks).toHaveLength(20);
    expect(result.current.isLoadingDefaults).toBe(false);
  });

  it("excludes stablecoins from the cryptos list by ticker", () => {
    const { result } = renderHook(() => useGlobalSearchDefaults(true));
    const { cryptos } = result.current.defaultSections;

    expect(cryptos.map(c => c.ticker)).toEqual(["BTC", "ETH", "SOL"]);
  });

  it("reports loading while the assets query is in flight", () => {
    mockedAssets.mockReturnValue({ data: undefined, isLoading: true } as never);

    const { result } = renderHook(() => useGlobalSearchDefaults(true));

    expect(result.current.isLoadingDefaults).toBe(true);
  });

  it("still returns cryptos when the stocks query fails (independent fetches)", () => {
    mockedStocks.mockReturnValue({ data: undefined, isLoading: false, isError: true } as never);

    const { result } = renderHook(() => useGlobalSearchDefaults(true));

    expect(result.current.defaultSections.cryptos).toHaveLength(3);
    expect(result.current.defaultSections.stocks).toHaveLength(0);
  });

  it("flags hasError when the assets query fails", () => {
    mockedAssets.mockReturnValue({ data: undefined, isLoading: false, isError: true } as never);

    const { result } = renderHook(() => useGlobalSearchDefaults(true));

    expect(result.current.hasError).toBe(true);
  });

  it("does nothing when disabled", () => {
    const { result } = renderHook(() => useGlobalSearchDefaults(false));

    expect(result.current.isLoadingDefaults).toBe(false);
    expect(result.current.hasError).toBe(false);
  });
});
