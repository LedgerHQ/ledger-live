import React from "react";
import { render, screen, fireEvent } from "tests/testSetup";
import { useMarketData } from "@ledgerhq/live-common/market/hooks/useMarketDataProvider";
import { useStablecoinTickers } from "@ledgerhq/live-common/dada-client/hooks/useStablecoinTickers";
import { MarketCurrencyData } from "@ledgerhq/live-common/market/utils/types";
import { useAssetSuggestionsViewModel } from "../hooks/useAssetSuggestionsViewModel";
import { AssetSuggestionsSection } from "../AssetSuggestionsSection";

jest.mock("@ledgerhq/live-common/market/hooks/useMarketDataProvider");
jest.mock("@ledgerhq/live-common/dada-client/hooks/useStablecoinTickers");

const mockedUseMarketData = jest.mocked(useMarketData);
const mockedUseStablecoinTickers = jest.mocked(useStablecoinTickers);

const CRYPTOS_LIMIT = 3;
const STABLECOINS_LIMIT = 2;

function buildCurrency(overrides: Partial<MarketCurrencyData>): MarketCurrencyData {
  return {
    id: "bitcoin",
    ledgerIds: ["bitcoin"],
    name: "Bitcoin",
    ticker: "BTC",
    price: 100,
    marketcap: 1000,
    marketcapRank: 1,
    totalVolume: 0,
    high24h: 0,
    low24h: 0,
    priceChangePercentage: { "1h": 0, "24h": 1.23, "7d": 0, "30d": 0, "6m": 0, "1y": 0 },
    marketCapChangePercentage24h: 0,
    circulatingSupply: 0,
    ath: 0,
    athDate: new Date(),
    atl: 0,
    atlDate: new Date(),
    chartData: {} as MarketCurrencyData["chartData"],
    ...overrides,
  } as MarketCurrencyData;
}

const BTC = buildCurrency({
  id: "bitcoin",
  name: "Bitcoin",
  ticker: "BTC",
  ledgerIds: ["bitcoin"],
});
const ETH = buildCurrency({
  id: "ethereum",
  name: "Ethereum",
  ticker: "ETH",
  ledgerIds: ["ethereum"],
});
const USDT = buildCurrency({
  id: "tether",
  name: "Tether",
  ticker: "USDT",
  ledgerIds: ["ethereum/erc20/usd_tether__erc20_"],
});

function mockMarketData({
  data = [],
  isLoading = false,
}: {
  data?: MarketCurrencyData[];
  isLoading?: boolean;
}) {
  mockedUseMarketData.mockReturnValue({
    data,
    isLoading,
    isPending: isLoading,
    isError: false,
    isFetching: false,
    cachedMetadataMap: new Map(),
  } as unknown as ReturnType<typeof useMarketData>);
}

function mockStablecoinTickers({
  tickers = [],
  isLoading = false,
}: {
  tickers?: string[];
  isLoading?: boolean;
}) {
  mockedUseStablecoinTickers.mockReturnValue({
    tickers: new Set(tickers),
    isLoading,
    isError: false,
  });
}

const navigateToAsset = jest.fn();
const navigateToMarket = jest.fn();

function Harness() {
  const { cryptos, stablecoins } = useAssetSuggestionsViewModel({
    cryptosLimit: CRYPTOS_LIMIT,
    stablecoinsLimit: STABLECOINS_LIMIT,
  });
  return (
    <>
      <AssetSuggestionsSection
        {...cryptos}
        title="Cryptos"
        testIdPrefix="cryptos"
        limit={CRYPTOS_LIMIT}
        navigateToAsset={navigateToAsset}
        onSeeAll={navigateToMarket}
      />
      <AssetSuggestionsSection
        {...stablecoins}
        title="Stablecoins"
        testIdPrefix="stablecoins"
        limit={STABLECOINS_LIMIT}
        navigateToAsset={navigateToAsset}
        onSeeAll={navigateToMarket}
      />
    </>
  );
}

describe("SearchAssets suggestion sections", () => {
  afterEach(() => jest.clearAllMocks());

  it("shows cryptos and stablecoins skeletons simultaneously while loading", () => {
    mockMarketData({ isLoading: true });
    mockStablecoinTickers({ isLoading: true });

    render(<Harness />);

    expect(screen.getByTestId("cryptos-skeleton")).toBeVisible();
    expect(screen.getByTestId("stablecoins-skeleton")).toBeVisible();
  });

  it("splits market data into cryptos and stablecoins via the DADA tickers", () => {
    mockMarketData({ data: [BTC, USDT, ETH] });
    mockStablecoinTickers({ tickers: ["USDT"] });

    render(<Harness />);

    expect(screen.getByTestId("cryptos-item-btc")).toBeVisible();
    expect(screen.getByTestId("cryptos-item-eth")).toBeVisible();
    expect(screen.getByTestId("stablecoins-item-usdt")).toBeVisible();
    // A stablecoin must not leak into the cryptos list.
    expect(screen.queryByTestId("cryptos-item-usdt")).not.toBeInTheDocument();
  });

  it("navigates to the asset detail when a row is clicked", () => {
    mockMarketData({ data: [BTC] });
    mockStablecoinTickers({ tickers: ["USDT"] });

    render(<Harness />);

    fireEvent.click(screen.getByTestId("cryptos-item-btc"));
    expect(navigateToAsset).toHaveBeenCalledWith(BTC.id);
  });

  it("triggers the see-all handler from the section header", () => {
    mockMarketData({ data: [BTC] });
    mockStablecoinTickers({ tickers: ["USDT"] });

    render(<Harness />);

    fireEvent.click(screen.getByTestId("cryptos-see-all"));
    expect(navigateToMarket).toHaveBeenCalledTimes(1);
  });

  it("hides a section when it has no data", () => {
    mockMarketData({ data: [BTC] });
    mockStablecoinTickers({ tickers: ["USDT"] });

    render(<Harness />);

    expect(screen.getByTestId("cryptos-section")).toBeVisible();
    // No stablecoins in the data → section is hidden.
    expect(screen.queryByTestId("stablecoins-section")).not.toBeInTheDocument();
  });

  it("caps each section to the requested limit", () => {
    const extraCryptos = Array.from({ length: 5 }, (_, i) =>
      buildCurrency({
        id: `coin-${i}`,
        name: `Coin ${i}`,
        ticker: `C${i}`,
        ledgerIds: ["bitcoin"],
      }),
    );
    mockMarketData({ data: extraCryptos });
    mockStablecoinTickers({ tickers: [] });

    render(<Harness />);

    expect(screen.getByTestId("cryptos-item-c0")).toBeVisible();
    expect(screen.getByTestId("cryptos-item-c2")).toBeVisible();
    expect(screen.queryByTestId("cryptos-item-c3")).not.toBeInTheDocument();
  });

  it("caps cryptos to 3 and stablecoins to 2", () => {
    const stablecoins = Array.from({ length: 4 }, (_, i) =>
      buildCurrency({
        id: `stable-${i}`,
        name: `Stable ${i}`,
        ticker: `S${i}`,
        ledgerIds: ["ethereum"],
      }),
    );
    mockMarketData({ data: stablecoins });
    mockStablecoinTickers({ tickers: ["S0", "S1", "S2", "S3"] });

    render(<Harness />);

    expect(screen.getByTestId("stablecoins-item-s0")).toBeVisible();
    expect(screen.getByTestId("stablecoins-item-s1")).toBeVisible();
    expect(screen.queryByTestId("stablecoins-item-s2")).not.toBeInTheDocument();
  });
});
