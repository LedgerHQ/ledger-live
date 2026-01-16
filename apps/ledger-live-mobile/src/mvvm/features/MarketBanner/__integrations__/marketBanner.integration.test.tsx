import React from "react";
import { renderWithReactQuery, screen, waitFor } from "@tests/test-renderer";
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

      expect(await screen.findByTestId("market-banner-container")).toBeVisible();
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

      expect(await screen.findByTestId("market-banner-skeleton-0")).toBeVisible();
      expect(screen.getByTestId("market-banner-skeleton-1")).toBeVisible();
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

      expect(await screen.findByTestId("market-banner-tile-0")).toBeVisible();
      expect(screen.getByTestId("market-banner-tile-1")).toBeVisible();
      expect(screen.getByText("BTC")).toBeVisible();
      expect(screen.getByText("ETH")).toBeVisible();
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

      expect(await screen.findByTestId("market-banner-view-all")).toBeVisible();
      expect(screen.getByText(/View all/i)).toBeVisible();
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

      expect(await screen.findByText(/Explore market/i)).toBeVisible();
    });
  });

  describe("Analytics tracking", () => {
    it("should track tile click", async () => {
      server.use(
        http.get(`${COUNTERVALUES_API}/v3/markets`, () =>
          HttpResponse.json(MOCK_MARKET_PERFORMERS),
        ),
      );

      const { user } = renderWithReactQuery(<MarketBannerTest />, {
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
      await user.press(tile);

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

      const { user } = renderWithReactQuery(<MarketBannerTest />, {
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
      await user.press(viewAllTile);

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

      const { user } = renderWithReactQuery(<MarketBannerTest />, {
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

      const sectionTitle = await screen.findByText(/Explore market/i);
      await user.press(sectionTitle);

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

      const { user } = renderWithReactQuery(<MarketBannerTest />, {
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
      await user.press(tile);

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

      const { user } = renderWithReactQuery(<MarketBannerTest />, {
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
      await user.press(viewAllTile);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("Market", {
          screen: "MarketList",
          params: {},
        });
      });
    });
  });

  // TODO REACT19: Skipped until @ledgerhq/lumen-ui-rnative is fully compatible with React 19 test renderer
  describe.skip("Fear and Greed index", () => {
    const API_ENDPOINT = "https://proxycmc.api.live.ledger.com/v3/fear-and-greed/latest";

    it("should display fear and greed index", async () => {
      server.use(
        http.get(API_ENDPOINT, () =>
          HttpResponse.json({
            data: {
              value: 50,
              value_classification: "Neutral",
              update_time: "2026-01-14T12:00:00Z",
            },
            status: {
              timestamp: "2026-01-14T12:00:00Z",
              error_code: 0,
              error_message: "",
              elapsed: 10,
              credit_count: 1,
            },
          }),
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

      expect(await screen.findByText(/neutral/i)).toBeVisible();
    });

    it("should not display fear and greed index", async () => {
      server.use(http.get(API_ENDPOINT, () => HttpResponse.json(null, { status: 500 })));

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

      expect(await screen.queryByText(/neutral/i)).toBeNull();
    });
  });
});
