import React from "react";
import { render, screen, fireEvent, waitFor, renderHook } from "@tests/test-renderer";
import { useTranslation } from "react-i18next";
import merge from "lodash/merge";
import { track } from "~/analytics";
import { MarketBannerTest, MOCK_MARKET_PERFORMERS } from "./shared";
import * as useMarketPerformersModule from "@ledgerhq/live-common/market/hooks/useMarketPerformers";
import * as useRampCatalogModule from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import * as useFetchCurrencyAllModule from "@ledgerhq/live-common/exchange/swap/hooks/index";

jest.mock("~/analytics", () => ({
  track: jest.fn(),
  screen: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/market/hooks/useMarketPerformers", () => ({
  useMarketPerformers: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog", () => ({
  useRampCatalog: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/exchange/swap/hooks/index", () => ({
  useFetchCurrencyAll: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

const mockUseMarketPerformers = useMarketPerformersModule.useMarketPerformers as jest.Mock;
const mockUseRampCatalog = useRampCatalogModule.useRampCatalog as jest.Mock;
const mockUseFetchCurrencyAll = useFetchCurrencyAllModule.useFetchCurrencyAll as jest.Mock;

describe("MarketBanner Integration Tests", () => {
  const { t } = renderHook(useTranslation).result.current;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();

    mockUseRampCatalog.mockReturnValue({
      isCurrencyAvailable: (id: string) => ["bitcoin", "ethereum", "solana"].includes(id),
    });

    mockUseFetchCurrencyAll.mockReturnValue({
      data: ["bitcoin", "ethereum", "solana", "polkadot"],
    });
  });

  describe("Feature flag handling", () => {
    it("should not render when lwmWallet40 feature flag is disabled", () => {
      mockUseMarketPerformers.mockReturnValue({
        data: MOCK_MARKET_PERFORMERS,
        isLoading: false,
        isError: false,
      });

      render(<MarketBannerTest />, {
        overrideInitialState: state =>
          merge({}, state, {
            settings: {
              overriddenFeatureFlags: {
                lwmWallet40: { enabled: false, params: { marketBanner: true } },
              },
            },
          }),
      });

      expect(screen.queryByTestId("market-banner-container")).toBeNull();
    });

    it("should not render when marketBanner param is false", () => {
      mockUseMarketPerformers.mockReturnValue({
        data: MOCK_MARKET_PERFORMERS,
        isLoading: false,
        isError: false,
      });

      render(<MarketBannerTest />, {
        overrideInitialState: state =>
          merge({}, state, {
            settings: {
              overriddenFeatureFlags: {
                lwmWallet40: { enabled: true, params: { marketBanner: false } },
              },
            },
          }),
      });

      expect(screen.queryByTestId("market-banner-container")).toBeNull();
    });

    it("should render when lwmWallet40 is enabled and marketBanner is true", () => {
      mockUseMarketPerformers.mockReturnValue({
        data: MOCK_MARKET_PERFORMERS,
        isLoading: false,
        isError: false,
      });

      render(<MarketBannerTest />, {
        overrideInitialState: state =>
          merge({}, state, {
            settings: {
              overriddenFeatureFlags: {
                lwmWallet40: { enabled: true, params: { marketBanner: true } },
              },
            },
          }),
      });

      expect(screen.getByTestId("market-banner-container")).toBeTruthy();
    });
  });

  describe("Loading state", () => {
    it("should display skeleton tiles when loading", () => {
      mockUseMarketPerformers.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
      });

      render(<MarketBannerTest />, {
        overrideInitialState: state =>
          merge({}, state, {
            settings: {
              overriddenFeatureFlags: {
                lwmWallet40: { enabled: true, params: { marketBanner: true } },
              },
            },
          }),
      });

      expect(screen.getByTestId("market-banner-skeleton-0")).toBeTruthy();
      expect(screen.getByTestId("market-banner-skeleton-1")).toBeTruthy();
    });
  });

  describe("Tile rendering", () => {
    it("should render market tiles with correct data", () => {
      mockUseMarketPerformers.mockReturnValue({
        data: MOCK_MARKET_PERFORMERS,
        isLoading: false,
        isError: false,
      });

      render(<MarketBannerTest />, {
        overrideInitialState: state =>
          merge({}, state, {
            settings: {
              overriddenFeatureFlags: {
                lwmWallet40: { enabled: true, params: { marketBanner: true } },
              },
            },
          }),
      });

      expect(screen.getByTestId("market-banner-tile-0")).toBeTruthy();
      expect(screen.getByTestId("market-banner-tile-1")).toBeTruthy();
      expect(screen.getByText("Bitcoin")).toBeTruthy();
      expect(screen.getByText("Ethereum")).toBeTruthy();
    });

    it("should render View All tile as the last element", () => {
      mockUseMarketPerformers.mockReturnValue({
        data: MOCK_MARKET_PERFORMERS,
        isLoading: false,
        isError: false,
      });

      render(<MarketBannerTest />, {
        overrideInitialState: state =>
          merge({}, state, {
            settings: {
              overriddenFeatureFlags: {
                lwmWallet40: { enabled: true, params: { marketBanner: true } },
              },
            },
          }),
      });

      expect(screen.getByTestId("market-banner-view-all")).toBeTruthy();
      expect(screen.getByText(t("marketBanner.viewAll"))).toBeTruthy();
    });

    it("should display section title", () => {
      mockUseMarketPerformers.mockReturnValue({
        data: MOCK_MARKET_PERFORMERS,
        isLoading: false,
        isError: false,
      });

      render(<MarketBannerTest />, {
        overrideInitialState: state =>
          merge({}, state, {
            settings: {
              overriddenFeatureFlags: {
                lwmWallet40: { enabled: true, params: { marketBanner: true } },
              },
            },
          }),
      });

      expect(screen.getByText(t("marketBanner.title"))).toBeTruthy();
    });
  });

  describe("Analytics tracking", () => {
    it("should track tile click", async () => {
      mockUseMarketPerformers.mockReturnValue({
        data: MOCK_MARKET_PERFORMERS,
        isLoading: false,
        isError: false,
      });

      render(<MarketBannerTest />, {
        overrideInitialState: state =>
          merge({}, state, {
            settings: {
              overriddenFeatureFlags: {
                lwmWallet40: { enabled: true, params: { marketBanner: true } },
              },
            },
          }),
      });

      const tile = screen.getByTestId("market-banner-tile-0");
      fireEvent.press(tile);

      await waitFor(() => {
        expect(track).toHaveBeenCalledWith("button_clicked", {
          button: "Market Tile",
          page: "Wallet",
          coin: "Bitcoin",
          banner: "Market Banner",
        });
      });
    });

    it("should track View All click", async () => {
      mockUseMarketPerformers.mockReturnValue({
        data: MOCK_MARKET_PERFORMERS,
        isLoading: false,
        isError: false,
      });

      render(<MarketBannerTest />, {
        overrideInitialState: state =>
          merge({}, state, {
            settings: {
              overriddenFeatureFlags: {
                lwmWallet40: { enabled: true, params: { marketBanner: true } },
              },
            },
          }),
      });

      const viewAllTile = screen.getByTestId("market-banner-view-all");
      fireEvent.press(viewAllTile);

      await waitFor(() => {
        expect(track).toHaveBeenCalledWith("button_clicked", {
          button: "View All",
          page: "Wallet",
          banner: "Market Banner",
        });
      });
    });

    it("should track section title click", async () => {
      mockUseMarketPerformers.mockReturnValue({
        data: MOCK_MARKET_PERFORMERS,
        isLoading: false,
        isError: false,
      });

      render(<MarketBannerTest />, {
        overrideInitialState: state =>
          merge({}, state, {
            settings: {
              overriddenFeatureFlags: {
                lwmWallet40: { enabled: true, params: { marketBanner: true } },
              },
            },
          }),
      });

      const sectionTitle = screen.getByText(t("marketBanner.title"));
      fireEvent.press(sectionTitle);

      await waitFor(() => {
        expect(track).toHaveBeenCalledWith("button_clicked", {
          button: "Section Title",
          page: "Wallet",
          banner: "Market Banner",
        });
      });
    });

    it("should track swipe only once", async () => {
      mockUseMarketPerformers.mockReturnValue({
        data: MOCK_MARKET_PERFORMERS,
        isLoading: false,
        isError: false,
      });

      render(<MarketBannerTest />, {
        overrideInitialState: state =>
          merge({}, state, {
            settings: {
              overriddenFeatureFlags: {
                lwmWallet40: { enabled: true, params: { marketBanner: true } },
              },
            },
          }),
      });

      const list = screen.getByTestId("market-banner-list");

      // Simulate layout first for FlatList to work properly
      fireEvent(list, "layout", {
        nativeEvent: { layout: { width: 400, height: 150 } },
      });

      fireEvent.scroll(list, {
        nativeEvent: {
          contentOffset: { x: 50, y: 0 },
          contentSize: { width: 800, height: 150 },
          layoutMeasurement: { width: 400, height: 150 },
        },
      });

      fireEvent.scroll(list, {
        nativeEvent: {
          contentOffset: { x: 100, y: 0 },
          contentSize: { width: 800, height: 150 },
          layoutMeasurement: { width: 400, height: 150 },
        },
      });

      await waitFor(() => {
        const swipeCalls = (track as jest.Mock).mock.calls.filter(call => call[0] === "swipe");
        expect(swipeCalls.length).toBe(1);
        expect(swipeCalls[0]).toEqual(["swipe", { page: "Wallet", banner: "Market Banner" }]);
      });
    });
  });

  describe("Navigation", () => {
    it("should navigate to market detail when tile is pressed", async () => {
      mockUseMarketPerformers.mockReturnValue({
        data: MOCK_MARKET_PERFORMERS,
        isLoading: false,
        isError: false,
      });

      render(<MarketBannerTest />, {
        overrideInitialState: state =>
          merge({}, state, {
            settings: {
              overriddenFeatureFlags: {
                lwmWallet40: { enabled: true, params: { marketBanner: true } },
              },
            },
          }),
      });

      const tile = screen.getByTestId("market-banner-tile-0");
      fireEvent.press(tile);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("MarketDetail", {
          currencyId: "bitcoin",
        });
      });
    });

    it("should navigate to market list when View All is pressed", async () => {
      mockUseMarketPerformers.mockReturnValue({
        data: MOCK_MARKET_PERFORMERS,
        isLoading: false,
        isError: false,
      });

      render(<MarketBannerTest />, {
        overrideInitialState: state =>
          merge({}, state, {
            settings: {
              overriddenFeatureFlags: {
                lwmWallet40: { enabled: true, params: { marketBanner: true } },
              },
            },
          }),
      });

      const viewAllTile = screen.getByTestId("market-banner-view-all");
      fireEvent.press(viewAllTile);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("Market", {
          screen: "MarketList",
          params: {},
        });
      });
    });
  });

  describe("Currency filtering", () => {
    it("should only display currencies available for buy/sell/swap", () => {
      const mixedData = [
        ...MOCK_MARKET_PERFORMERS.slice(0, 3),
        {
          id: "unavailable-coin",
          name: "Unavailable",
          ticker: "UNA",
          image: null,
          price: 1,
          priceChangePercentage24h: 1,
          priceChangePercentage7d: 1,
          priceChangePercentage30d: 1,
          priceChangePercentage1y: 1,
          ledgerIds: ["unavailable"],
        },
      ];

      mockUseMarketPerformers.mockReturnValue({
        data: mixedData,
        isLoading: false,
        isError: false,
      });

      mockUseRampCatalog.mockReturnValue({
        isCurrencyAvailable: (id: string) => ["bitcoin", "ethereum"].includes(id),
      });

      mockUseFetchCurrencyAll.mockReturnValue({
        data: ["bitcoin", "solana"],
      });

      render(<MarketBannerTest />, {
        overrideInitialState: state =>
          merge({}, state, {
            settings: {
              overriddenFeatureFlags: {
                lwmWallet40: { enabled: true, params: { marketBanner: true } },
              },
            },
          }),
      });

      expect(screen.getByText("Bitcoin")).toBeTruthy();
      expect(screen.getByText("Ethereum")).toBeTruthy();
      expect(screen.getByText("Solana")).toBeTruthy();
      expect(screen.queryByText("Unavailable")).toBeNull();
    });
  });
});
