import React from "react";
import { render, screen, fireEvent } from "tests/testSetup";
import { useAssetsData } from "@ledgerhq/live-common/dada-client/hooks/useAssetsData";
import { useStablecoinTickers } from "@ledgerhq/live-common/dada-client/hooks/useStablecoinTickers";
import { useUsdToFiatRate } from "@ledgerhq/live-common/counterValues/hooks/useUsdToFiatRate";
import { AssetsDataWithPagination } from "@ledgerhq/live-common/dada-client/state-manager/types";
import { useAssetSuggestionsViewModel } from "../hooks/useAssetSuggestionsViewModel";
import { AssetSuggestionsSection } from "../AssetSuggestionsSection";

jest.mock("@ledgerhq/live-common/dada-client/hooks/useAssetsData");
jest.mock("@ledgerhq/live-common/dada-client/hooks/useStablecoinTickers");
jest.mock("@ledgerhq/live-common/counterValues/hooks/useUsdToFiatRate");

const mockedUseAssetsData = jest.mocked(useAssetsData);
const mockedUseStablecoinTickers = jest.mocked(useStablecoinTickers);
const mockedUseUsdToFiatRate = jest.mocked(useUsdToFiatRate);

const CRYPTOS_LIMIT = 3;

type AssetDescriptor = {
  id: string;
  name: string;
  ticker: string;
  ledgerId: string;
};

const BTC: AssetDescriptor = {
  id: "bitcoin",
  name: "Bitcoin",
  ticker: "BTC",
  ledgerId: "bitcoin",
};
const ETH: AssetDescriptor = {
  id: "ethereum",
  name: "Ethereum",
  ticker: "ETH",
  ledgerId: "ethereum",
};
const USDT: AssetDescriptor = {
  id: "tether",
  name: "Tether",
  ticker: "USDT",
  ledgerId: "ethereum/erc20/usd_tether__erc20_",
};

/** Builds a minimal DADA assets-data payload from a list of assets, preserving order. */
function buildAssetsData(assets: AssetDescriptor[]): AssetsDataWithPagination {
  const cryptoAssets: Record<string, unknown> = {};
  const cryptoOrTokenCurrencies: Record<string, unknown> = {};
  const markets: Record<string, unknown> = {};

  for (const asset of assets) {
    cryptoAssets[asset.id] = {
      id: asset.id,
      ticker: asset.ticker,
      name: asset.name,
      assetsIds: { network: asset.ledgerId },
    };
    cryptoOrTokenCurrencies[asset.ledgerId] = {
      id: asset.ledgerId,
      type: "CryptoCurrency",
      ticker: asset.ticker,
      name: asset.name,
    };
    markets[asset.ledgerId] = {
      id: asset.id,
      price: 100,
      priceChangePercentage24h: 1.23,
    };
  }

  return {
    cryptoAssets,
    cryptoOrTokenCurrencies,
    markets,
    networks: {},
    interestRates: {},
    currenciesOrder: { key: "marketCap", order: "desc", metaCurrencyIds: assets.map(a => a.id) },
    pagination: {},
  } as unknown as AssetsDataWithPagination;
}

function mockAssetsData({
  data = [],
  isLoading = false,
}: {
  data?: AssetDescriptor[];
  isLoading?: boolean;
}) {
  mockedUseAssetsData.mockReturnValue({
    data: isLoading ? undefined : buildAssetsData(data),
    isLoading,
    isError: false,
  } as unknown as ReturnType<typeof useAssetsData>);
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
  const { cryptos } = useAssetSuggestionsViewModel({ cryptosLimit: CRYPTOS_LIMIT });
  return (
    <AssetSuggestionsSection
      {...cryptos}
      title="Cryptos"
      testIdPrefix="cryptos"
      limit={CRYPTOS_LIMIT}
      navigateToAsset={navigateToAsset}
      onSeeAll={navigateToMarket}
    />
  );
}

describe("SearchAssets suggestion sections", () => {
  beforeEach(() => mockedUseUsdToFiatRate.mockReturnValue({ status: "ready", rate: 1 }));
  afterEach(() => jest.clearAllMocks());

  it("shows the cryptos skeleton while loading", () => {
    mockAssetsData({ isLoading: true });
    mockStablecoinTickers({ isLoading: true });

    render(<Harness />);

    expect(screen.getByTestId("cryptos-skeleton")).toBeVisible();
  });

  it("excludes stablecoins from the cryptos list via the DADA tickers", () => {
    mockAssetsData({ data: [BTC, USDT, ETH] });
    mockStablecoinTickers({ tickers: ["USDT"] });

    render(<Harness />);

    expect(screen.getByTestId("cryptos-item-btc")).toBeVisible();
    expect(screen.getByTestId("cryptos-item-eth")).toBeVisible();
    // A stablecoin must not leak into the cryptos list.
    expect(screen.queryByTestId("cryptos-item-usdt")).not.toBeInTheDocument();
  });

  it("navigates to the asset detail when a row is clicked", () => {
    mockAssetsData({ data: [BTC] });
    mockStablecoinTickers({ tickers: ["USDT"] });

    render(<Harness />);

    fireEvent.click(screen.getByTestId("cryptos-item-btc"));
    expect(navigateToAsset).toHaveBeenCalledWith(BTC.id, expect.objectContaining({ id: BTC.id }));
  });

  it("triggers the see-all handler from the section header", () => {
    mockAssetsData({ data: [BTC] });
    mockStablecoinTickers({ tickers: ["USDT"] });

    render(<Harness />);

    fireEvent.click(screen.getByTestId("cryptos-see-all"));
    expect(navigateToMarket).toHaveBeenCalledTimes(1);
  });

  it("hides a section when it has no data", () => {
    mockAssetsData({ data: [] });
    mockStablecoinTickers({ tickers: ["USDT"] });

    render(<Harness />);

    // No data → section is hidden.
    expect(screen.queryByTestId("cryptos-section")).not.toBeInTheDocument();
  });

  it("caps each section to the requested limit", () => {
    const extraCryptos = Array.from({ length: 5 }, (_, i) => ({
      id: `coin-${i}`,
      name: `Coin ${i}`,
      ticker: `C${i}`,
      ledgerId: `coin-${i}`,
    }));
    mockAssetsData({ data: extraCryptos });
    mockStablecoinTickers({ tickers: [] });

    render(<Harness />);

    expect(screen.getByTestId("cryptos-item-c0")).toBeVisible();
    expect(screen.getByTestId("cryptos-item-c2")).toBeVisible();
    expect(screen.queryByTestId("cryptos-item-c3")).not.toBeInTheDocument();
  });
});
