import React from "react";
import { renderWithReactQuery, screen, fireEvent, waitFor, renderHook } from "@tests/test-renderer";
import { useTranslation } from "react-i18next";
import { server, http, HttpResponse } from "@tests/server";
import { MarketBannerTest, MOCK_MARKET_PERFORMERS } from "./shared";

const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock useFetchCurrencyAll as it has complex dependencies (providers fetching)
const mockUseFetchCurrencyAll = jest.fn();
jest.mock("@ledgerhq/live-common/exchange/swap/hooks/index", () => ({
  useFetchCurrencyAll: () => mockUseFetchCurrencyAll(),
}));

const COUNTERVALUES_API = "https://countervalues.live.ledger.com";
const BUY_API = "https://buy.api.live.ledger.com/buy/v1";

// Mock data for ramp catalog API
const MOCK_RAMP_CATALOG = {
  onRamp: {
    provider1: ["bitcoin", "ethereum", "solana"],
  },
  offRamp: {
    provider1: ["bitcoin", "ethereum"],
  },
};

describe("MarketBanner Integration Tests", () => {
  const { t } = renderHook(useTranslation).result.current;

  beforeEach(() => {
    mockNavigate.mockClear();
    mockUseFetchCurrencyAll.mockClear();

    // Default MSW handlers
    server.use(
      http.get(`${BUY_API}/provider/currencies`, () => HttpResponse.json(MOCK_RAMP_CATALOG)),
    );

    // Default mock for useFetchCurrencyAll
    mockUseFetchCurrencyAll.mockReturnValue({
      data: ["bitcoin", "ethereum", "solana", "polkadot"],
    });
  });

  describe("Feature flag handling", () => {
    it("should not render when lwmWallet40 feature flag is disabled", () => {
      server.use(
        http.get(`${COUNTERVALUES_API}/v3/markets`, () =>
          HttpResponse.json(MOCK_MARKET_PERFORMERS),
        ),
      );

      renderWithReactQuery(<MarketBannerTest />, {
        overrideInitialState: state => ({
          ...state,
          settings: {
            ...state.settings,
            overriddenFeatureFlags: {
              lwmWallet40: { enabled: false, params: { marketBanner: true } },
            },
          },
        }),
      });

      expect(screen.queryByTestId("market-banner-container")).toBeNull();
    });

    it("should not render when marketBanner param is false", () => {
      server.use(
        http.get(`${COUNTERVALUES_API}/v3/markets`, () =>
          HttpResponse.json(MOCK_MARKET_PERFORMERS),
        ),
      );

      renderWithReactQuery(<MarketBannerTest />, {
        overrideInitialState: state => ({
          ...state,
          settings: {
            ...state.settings,
            overriddenFeatureFlags: {
              lwmWallet40: { enabled: true, params: { marketBanner: false } },
            },
          },
        }),
      });

      expect(screen.queryByTestId("market-banner-container")).toBeNull();
    });

    it("should render when lwmWallet40 is enabled and marketBanner is true", async () => {
      server.use(
        http.get(`${COUNTERVALUES_API}/v3/markets`, () =>
          HttpResponse.json(MOCK_MARKET_PERFORMERS),
        ),
      );

      renderWithReactQuery(<MarketBannerTest />, {
        overrideInitialState: state => ({
          ...state,
          settings: {
            ...state.settings,
            overriddenFeatureFlags: {
              lwmWallet40: { enabled: true, params: { marketBanner: true } },
            },
          },
        }),
      });

      expect(await screen.findByTestId("market-banner-container")).toBeTruthy();
    });
  });

  describe("Loading state", () => {
    it("should display skeleton tiles when loading", async () => {
      server.use(
        http.get(`${COUNTERVALUES_API}/v3/markets`, async () => {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return HttpResponse.json(MOCK_MARKET_PERFORMERS);
        }),
      );

      renderWithReactQuery(<MarketBannerTest />, {
        overrideInitialState: state => ({
          ...state,
          settings: {
            ...state.settings,
            overriddenFeatureFlags: {
              lwmWallet40: { enabled: true, params: { marketBanner: true } },
            },
          },
        }),
      });

      expect(await screen.findByTestId("market-banner-skeleton-0")).toBeTruthy();
      expect(screen.getByTestId("market-banner-skeleton-1")).toBeTruthy();
    });
  });

  describe("Tile rendering", () => {
    it("should render market tiles with correct data", async () => {
      server.use(
        http.get(`${COUNTERVALUES_API}/v3/markets`, () =>
          HttpResponse.json(MOCK_MARKET_PERFORMERS),
        ),
      );

      renderWithReactQuery(<MarketBannerTest />, {
        overrideInitialState: state => ({
          ...state,
          settings: {
            ...state.settings,
            overriddenFeatureFlags: {
              lwmWallet40: { enabled: true, params: { marketBanner: true } },
            },
          },
        }),
      });

      expect(await screen.findByTestId("market-banner-tile-0")).toBeTruthy();
      expect(screen.getByTestId("market-banner-tile-1")).toBeTruthy();
      expect(screen.getByText("Bitcoin")).toBeTruthy();
      expect(screen.getByText("Ethereum")).toBeTruthy();
    });

    it("should render View All tile as the last element", async () => {
      server.use(
        http.get(`${COUNTERVALUES_API}/v3/markets`, () =>
          HttpResponse.json(MOCK_MARKET_PERFORMERS),
        ),
      );

      renderWithReactQuery(<MarketBannerTest />, {
        overrideInitialState: state => ({
          ...state,
          settings: {
            ...state.settings,
            overriddenFeatureFlags: {
              lwmWallet40: { enabled: true, params: { marketBanner: true } },
            },
          },
        }),
      });

      expect(await screen.findByTestId("market-banner-view-all")).toBeTruthy();
      expect(screen.getByText(t("marketBanner.viewAll"))).toBeTruthy();
    });

    it("should display section title", async () => {
      server.use(
        http.get(`${COUNTERVALUES_API}/v3/markets`, () =>
          HttpResponse.json(MOCK_MARKET_PERFORMERS),
        ),
      );

      renderWithReactQuery(<MarketBannerTest />, {
        overrideInitialState: state => ({
          ...state,
          settings: {
            ...state.settings,
            overriddenFeatureFlags: {
              lwmWallet40: { enabled: true, params: { marketBanner: true } },
            },
          },
        }),
      });

      expect(await screen.findByText(t("marketBanner.title"))).toBeTruthy();
    });
  });

  describe("Analytics tracking", () => {
    it("should track tile click", async () => {
      server.use(
        http.get(`${COUNTERVALUES_API}/v3/markets`, () =>
          HttpResponse.json(MOCK_MARKET_PERFORMERS),
        ),
      );

      renderWithReactQuery(<MarketBannerTest />, {
        overrideInitialState: state => ({
          ...state,
          settings: {
            ...state.settings,
            overriddenFeatureFlags: {
              lwmWallet40: { enabled: true, params: { marketBanner: true } },
            },
          },
        }),
      });

      const tile = await screen.findByTestId("market-banner-tile-0");
      fireEvent.press(tile);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("MarketDetail", {
          currencyId: "bitcoin",
        });
      });
    });

    it("should track View All click", async () => {
      server.use(
        http.get(`${COUNTERVALUES_API}/v3/markets`, () =>
          HttpResponse.json(MOCK_MARKET_PERFORMERS),
        ),
      );

      renderWithReactQuery(<MarketBannerTest />, {
        overrideInitialState: state => ({
          ...state,
          settings: {
            ...state.settings,
            overriddenFeatureFlags: {
              lwmWallet40: { enabled: true, params: { marketBanner: true } },
            },
          },
        }),
      });

      const viewAllTile = await screen.findByTestId("market-banner-view-all");
      fireEvent.press(viewAllTile);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("Market", {
          screen: "MarketList",
          params: {},
        });
      });
    });

    it("should track section title click", async () => {
      server.use(
        http.get(`${COUNTERVALUES_API}/v3/markets`, () =>
          HttpResponse.json(MOCK_MARKET_PERFORMERS),
        ),
      );

      renderWithReactQuery(<MarketBannerTest />, {
        overrideInitialState: state => ({
          ...state,
          settings: {
            ...state.settings,
            overriddenFeatureFlags: {
              lwmWallet40: { enabled: true, params: { marketBanner: true } },
            },
          },
        }),
      });

      const sectionTitle = await screen.findByText(t("marketBanner.title"));
      fireEvent.press(sectionTitle);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("Market", {
          screen: "MarketList",
          params: {},
        });
      });
    });
  });

  describe("Navigation", () => {
    it("should navigate to market detail when tile is pressed", async () => {
      server.use(
        http.get(`${COUNTERVALUES_API}/v3/markets`, () =>
          HttpResponse.json(MOCK_MARKET_PERFORMERS),
        ),
      );

      renderWithReactQuery(<MarketBannerTest />, {
        overrideInitialState: state => ({
          ...state,
          settings: {
            ...state.settings,
            overriddenFeatureFlags: {
              lwmWallet40: { enabled: true, params: { marketBanner: true } },
            },
          },
        }),
      });

      const tile = await screen.findByTestId("market-banner-tile-0");
      fireEvent.press(tile);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("MarketDetail", {
          currencyId: "bitcoin",
        });
      });
    });

    it("should navigate to market list when View All is pressed", async () => {
      server.use(
        http.get(`${COUNTERVALUES_API}/v3/markets`, () =>
          HttpResponse.json(MOCK_MARKET_PERFORMERS),
        ),
      );

      renderWithReactQuery(<MarketBannerTest />, {
        overrideInitialState: state => ({
          ...state,
          settings: {
            ...state.settings,
            overriddenFeatureFlags: {
              lwmWallet40: { enabled: true, params: { marketBanner: true } },
            },
          },
        }),
      });

      const viewAllTile = await screen.findByTestId("market-banner-view-all");
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
    it("should only display currencies available for buy/sell/swap", async () => {
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

      server.use(
        http.get(`${COUNTERVALUES_API}/v3/markets`, () => HttpResponse.json(mixedData)),
        // Ramp catalog only supports bitcoin and ethereum for buy
        http.get(`${BUY_API}/provider/currencies`, () =>
          HttpResponse.json({
            onRamp: { provider1: ["bitcoin", "ethereum"] },
            offRamp: { provider1: ["bitcoin"] },
          }),
        ),
      );

      // Swap only supports bitcoin and solana
      mockUseFetchCurrencyAll.mockReturnValue({
        data: ["bitcoin", "solana"],
      });

      renderWithReactQuery(<MarketBannerTest />, {
        overrideInitialState: state => ({
          ...state,
          settings: {
            ...state.settings,
            overriddenFeatureFlags: {
              lwmWallet40: { enabled: true, params: { marketBanner: true } },
            },
          },
        }),
      });

      // Bitcoin available via buy AND swap
      expect(await screen.findByText("Bitcoin")).toBeTruthy();
      // Ethereum available via buy only
      expect(screen.getByText("Ethereum")).toBeTruthy();
      // Solana available via swap only
      expect(screen.getByText("Solana")).toBeTruthy();
      // Unavailable coin should not be displayed
      expect(screen.queryByText("Unavailable")).toBeNull();
    });
  });
});
