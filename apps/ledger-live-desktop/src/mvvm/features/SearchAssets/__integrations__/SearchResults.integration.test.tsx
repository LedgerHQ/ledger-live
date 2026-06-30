import React from "react";
import { render, renderHook, screen } from "tests/testSetup";
import { useAssetsData } from "@ledgerhq/live-common/dada-client/hooks/useAssetsData";
import { useUsdToFiatRate } from "@ledgerhq/live-common/counterValues/hooks/useUsdToFiatRate";
import { AssetsDataWithPagination } from "@ledgerhq/live-common/dada-client/state-manager/types";
import { useAssetSearchResultsViewModel } from "../hooks/useAssetSearchResultsViewModel";
import { buildSearchMarketCurrencyData } from "../utils/buildSearchMarketCurrencyData";
import { AssetSuggestionRow } from "../components/AssetSuggestionRow";

jest.mock("@ledgerhq/live-common/dada-client/hooks/useAssetsData");
jest.mock("@ledgerhq/live-common/counterValues/hooks/useUsdToFiatRate");

const mockedUseAssetsData = jest.mocked(useAssetsData);
const mockedUseUsdToFiatRate = jest.mocked(useUsdToFiatRate);

type AssetDescriptor = {
  id: string;
  name: string;
  ticker: string;
  ledgerId: string;
  price: number;
};

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
    markets[asset.ledgerId] = { id: asset.id, price: asset.price, priceChangePercentage24h: 1.23 };
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
  data,
  isLoading = false,
  isError = false,
  loadNext,
  isFetchingNextPage = false,
}: {
  data?: AssetDescriptor[];
  isLoading?: boolean;
  isError?: boolean;
  loadNext?: () => void;
  isFetchingNextPage?: boolean;
}) {
  mockedUseAssetsData.mockReturnValue({
    data: data ? buildAssetsData(data) : undefined,
    isLoading,
    isError,
    loadNext,
    isFetchingNextPage,
  } as unknown as ReturnType<typeof useAssetsData>);
}

const BTC: AssetDescriptor = {
  id: "bitcoin",
  name: "Bitcoin",
  ticker: "BTC",
  ledgerId: "bitcoin",
  price: 100,
};

describe("search results integration", () => {
  afterEach(() => jest.clearAllMocks());

  describe("useAssetSearchResultsViewModel", () => {
    it("converts USD DADA prices into the counter currency via the usd→fiat rate", () => {
      mockAssetsData({ data: [BTC] });
      mockedUseUsdToFiatRate.mockReturnValue({ status: "ready", rate: 0.9 });

      const { result } = renderHook(() => useAssetSearchResultsViewModel({ search: "bit" }));

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data[0].price).toBeCloseTo(90);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(false);
    });

    it("returns every result (pagination handles the rest via infinite scroll)", () => {
      const assets = Array.from({ length: 5 }, (_, i) => ({
        id: `coin-${i}`,
        name: `Coin ${i}`,
        ticker: `C${i}`,
        ledgerId: `coin-${i}`,
        price: 10,
      }));
      mockAssetsData({ data: assets });
      mockedUseUsdToFiatRate.mockReturnValue({ status: "ready", rate: 1 });

      const { result } = renderHook(() => useAssetSearchResultsViewModel({ search: "c" }));

      expect(result.current.data).toHaveLength(5);
    });

    it("surfaces pagination so the list can load more on scroll", () => {
      const loadNext = jest.fn();
      mockAssetsData({ data: [BTC], loadNext, isFetchingNextPage: true });
      mockedUseUsdToFiatRate.mockReturnValue({ status: "ready", rate: 1 });

      const { result } = renderHook(() => useAssetSearchResultsViewModel({ search: "bit" }));

      expect(result.current.loadNext).toBe(loadNext);
      expect(result.current.hasNextPage).toBe(true);
      expect(result.current.isFetchingNextPage).toBe(true);
    });

    it("reports no next page when pagination is exhausted", () => {
      mockAssetsData({ data: [BTC] });
      mockedUseUsdToFiatRate.mockReturnValue({ status: "ready", rate: 1 });

      const { result } = renderHook(() => useAssetSearchResultsViewModel({ search: "bit" }));

      expect(result.current.loadNext).toBeUndefined();
      expect(result.current.hasNextPage).toBe(false);
    });

    it("stays loading and shows the unconverted USD price while the rate resolves", () => {
      mockAssetsData({ data: [BTC] });
      mockedUseUsdToFiatRate.mockReturnValue({ status: "loading", rate: null });

      const { result } = renderHook(() => useAssetSearchResultsViewModel({ search: "bit" }));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data[0].price).toBe(100);
    });

    it("surfaces an error when the rate fails to resolve", () => {
      mockAssetsData({ data: [BTC] });
      mockedUseUsdToFiatRate.mockReturnValue({ status: "error", rate: null });

      const { result } = renderHook(() => useAssetSearchResultsViewModel({ search: "bit" }));

      expect(result.current.isError).toBe(true);
    });
  });

  describe("expanded search row", () => {
    it("renders the asset name, ticker and 24h trend", () => {
      const currency = buildSearchMarketCurrencyData({
        id: "bitcoin",
        name: "Bitcoin",
        ticker: "BTC",
        ledgerIds: ["bitcoin"],
        price: 1858.08,
        priceChangePercentage24h: 2.34,
      });

      render(
        <AssetSuggestionRow
          currency={currency}
          counterCurrency="USD"
          locale="en"
          testIdPrefix="search-result"
          onClick={jest.fn()}
          density="default"
        />,
      );

      expect(screen.getByTestId("search-result-item-btc")).toBeInTheDocument();
      expect(screen.getByText("Bitcoin")).toBeInTheDocument();
      expect(screen.getByText("BTC")).toBeInTheDocument();
      expect(screen.getByText("2.34%")).toBeInTheDocument();
    });
  });
});
