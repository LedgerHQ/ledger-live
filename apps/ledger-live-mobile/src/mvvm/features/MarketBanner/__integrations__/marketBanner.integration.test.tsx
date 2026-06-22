import React from "react";
import {
  renderWithReactQuery,
  screen,
  waitFor,
  withFlagOverrides,
  within,
} from "@tests/test-renderer";
import { server, http, HttpResponse } from "@tests/server";
import { track } from "~/analytics";
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
        overrideInitialState: withFlagOverrides({
          lwmWallet40: { enabled: false, params: { marketBanner: true } },
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
        overrideInitialState: withFlagOverrides({
          lwmWallet40: { enabled: true, params: { marketBanner: false } },
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
        overrideInitialState: withFlagOverrides({
          lwmWallet40: { enabled: true, params: { marketBanner: true } },
        }),
      });

      expect(await screen.findByTestId("market-banner-container")).toBeVisible();
    });
  });

  describe("Filter trigger", () => {
    const renderWithAssetDiscoverability = (assetDiscoverability: boolean) => {
      server.use(
        http.get(`${COUNTERVALUES_API}/v3/markets`, () =>
          HttpResponse.json(MOCK_MARKET_PERFORMERS),
        ),
      );

      return renderWithReactQuery(<MarketBannerTest />, {
        overrideInitialState: withFlagOverrides({
          lwmWallet40: { enabled: true, params: { marketBanner: true, assetDiscoverability } },
        }),
      });
    };

    it("should not render the filter button when assetDiscoverability is disabled", async () => {
      renderWithAssetDiscoverability(false);

      expect(await screen.findByTestId("market-banner-container")).toBeVisible();
      expect(screen.queryByTestId("market-banner-filter-button")).toBeNull();
    });

    it("should render the filter button with the default 'Trending' label", async () => {
      renderWithAssetDiscoverability(true);

      const filterButton = await screen.findByTestId("market-banner-filter-button");
      expect(filterButton).toBeVisible();
      expect(within(filterButton).getByText("Trending")).toBeVisible();
    });

    it("should track the filter button when pressed", async () => {
      const { user } = renderWithAssetDiscoverability(true);

      const filterButton = await screen.findByTestId("market-banner-filter-button");
      await user.press(filterButton);

      await waitFor(() => {
        expect(track).toHaveBeenCalledWith("button_clicked", {
          button: "Market Banner Filter",
          page: "Wallet",
          banner: "Market Banner",
        });
      });
    });

    it("should render the four filter options in the drawer", async () => {
      const { user } = renderWithAssetDiscoverability(true);

      await user.press(await screen.findByTestId("market-banner-filter-button"));

      expect(await screen.findByTestId("market-banner-filter-drawer-trending")).toBeVisible();
      expect(screen.getByTestId("market-banner-filter-drawer-gainers")).toBeVisible();
      expect(screen.getByTestId("market-banner-filter-drawer-losers")).toBeVisible();
      expect(screen.getByTestId("market-banner-filter-drawer-favorites")).toBeVisible();
    });

    it("should persist the selected filter and track the change", async () => {
      const { user, store } = renderWithAssetDiscoverability(true);

      await user.press(await screen.findByTestId("market-banner-filter-button"));
      await user.press(await screen.findByTestId("market-banner-filter-drawer-losers"));

      await waitFor(() => {
        expect(store.getState().marketBanner.ranking).toBe("losers");
      });
      expect(track).toHaveBeenCalledWith("change_sort_market_banner", { sort: "losers" });
    });

    it("should fall back to trending when favorites is active but no asset is starred", async () => {
      server.use(
        http.get(`${COUNTERVALUES_API}/v3/markets`, () =>
          HttpResponse.json(MOCK_MARKET_PERFORMERS),
        ),
      );

      const { store } = renderWithReactQuery(<MarketBannerTest />, {
        overrideInitialState: state => {
          const flagged = withFlagOverrides({
            lwmWallet40: {
              enabled: true,
              params: { marketBanner: true, assetDiscoverability: true },
            },
          })(state);
          return {
            ...flagged,
            marketBanner: { ...flagged.marketBanner, ranking: "favorites" },
            settings: { ...flagged.settings, starredMarketCoins: [] },
          };
        },
      });

      await waitFor(() => {
        expect(store.getState().marketBanner.ranking).toBe("trending");
      });
    });

    it("should request favorites with a valid pageSize (the /v3/markets endpoint only accepts 1/5/20/50)", async () => {
      let favoritesPageSize: string | null = null;
      server.use(
        http.get(`${COUNTERVALUES_API}/v3/markets`, ({ request }) => {
          const url = new URL(request.url);
          if (url.searchParams.get("ids")) {
            favoritesPageSize = url.searchParams.get("pageSize");
          }
          return HttpResponse.json(MOCK_MARKET_PERFORMERS);
        }),
      );

      renderWithReactQuery(<MarketBannerTest />, {
        overrideInitialState: state => {
          const flagged = withFlagOverrides({
            lwmWallet40: {
              enabled: true,
              params: { marketBanner: true, assetDiscoverability: true },
            },
          })(state);
          return {
            ...flagged,
            marketBanner: { ...flagged.marketBanner, ranking: "favorites" },
            settings: { ...flagged.settings, starredMarketCoins: ["bitcoin", "ethereum"] },
          };
        },
      });

      await waitFor(() => expect(favoritesPageSize).not.toBeNull());
      expect(["1", "5", "20", "50"]).toContain(favoritesPageSize);
    });

    it("ignores the persisted ranking when assetDiscoverability is off and keeps the stored preference", async () => {
      let performersSort: string | null = null;
      server.use(
        http.get(`${COUNTERVALUES_API}/v3/markets`, ({ request }) => {
          const sort = new URL(request.url).searchParams.get("sort");
          if (sort?.includes("price-change")) performersSort = sort;
          return HttpResponse.json(MOCK_MARKET_PERFORMERS);
        }),
      );

      const { store } = renderWithReactQuery(<MarketBannerTest />, {
        overrideInitialState: state => {
          const flagged = withFlagOverrides({
            lwmWallet40: {
              enabled: true,
              params: { marketBanner: true, assetDiscoverability: false },
            },
          })(state);
          return {
            ...flagged,
            marketBanner: { ...flagged.marketBanner, ranking: "losers" },
          };
        },
      });

      await waitFor(() => expect(performersSort).not.toBeNull());
      expect(performersSort).toContain("positive-price-change");
      expect(store.getState().marketBanner.ranking).toBe("losers");
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
        overrideInitialState: withFlagOverrides({
          lwmWallet40: { enabled: true, params: { marketBanner: true } },
        }),
      });

      expect(await screen.findByTestId("market-banner-skeleton-0")).toBeVisible();
      expect(screen.getByTestId("market-banner-skeleton-1")).toBeVisible();
    });
  });

  describe("Error state", () => {
    it("should display error state with icon and message when API fails", async () => {
      server.use(
        http.get(`${COUNTERVALUES_API}/v3/markets`, () => HttpResponse.json(null, { status: 500 })),
      );

      renderWithReactQuery(<MarketBannerTest />, {
        overrideInitialState: withFlagOverrides({
          lwmWallet40: { enabled: true, params: { marketBanner: true } },
        }),
      });

      expect(await screen.findByText(/Connection failed/i)).toBeVisible();
    });

    it("should not display FearAndGreed or ViewAll when in error state", async () => {
      server.use(
        http.get(`${COUNTERVALUES_API}/v3/markets`, () => HttpResponse.json(null, { status: 500 })),
      );

      renderWithReactQuery(<MarketBannerTest />, {
        overrideInitialState: withFlagOverrides({
          lwmWallet40: { enabled: true, params: { marketBanner: true } },
        }),
      });

      expect(await screen.findByText(/Connection failed/i)).toBeVisible();
      expect(screen.queryByTestId("market-banner-view-all")).toBeNull();
      expect(screen.queryByTestId("fear-and-greed-card")).toBeNull();
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
        overrideInitialState: withFlagOverrides({
          lwmWallet40: { enabled: true, params: { marketBanner: true } },
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
        overrideInitialState: withFlagOverrides({
          lwmWallet40: { enabled: true, params: { marketBanner: true } },
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
        overrideInitialState: withFlagOverrides({
          lwmWallet40: { enabled: true, params: { marketBanner: true } },
        }),
      });

      expect(await screen.findByText("Market")).toBeVisible();
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
        overrideInitialState: withFlagOverrides({
          lwmWallet40: {
            enabled: true,
            params: { marketBanner: true, aggregatedAssets: true },
          },
        }),
      });

      const tile = await screen.findByTestId("market-banner-tile-0");
      await user.press(tile);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("AssetDetail", {
          screen: "AssetDetail",
          params: {
            currencyId: "bitcoin",
            source: "market_banner",
            marketState: { id: "bitcoin", ledgerIds: ["bitcoin"] },
          },
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
        overrideInitialState: withFlagOverrides({
          lwmWallet40: { enabled: true, params: { marketBanner: true } },
        }),
      });

      const viewAllTile = await screen.findByTestId("market-banner-view-all");
      await user.press(viewAllTile);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("MarketList");
      });
    });

    it("should track section title click", async () => {
      server.use(
        http.get(`${COUNTERVALUES_API}/v3/markets`, () =>
          HttpResponse.json(MOCK_MARKET_PERFORMERS),
        ),
      );

      const { user } = renderWithReactQuery(<MarketBannerTest />, {
        overrideInitialState: withFlagOverrides({
          lwmWallet40: { enabled: true, params: { marketBanner: true } },
        }),
      });

      const sectionTitle = await screen.findByText("Market");
      await user.press(sectionTitle);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("MarketList");
      });
    });
  });

  describe("Navigation", () => {
    it("navigates to AssetDetail when aggregatedAssets is enabled", async () => {
      server.use(
        http.get(`${COUNTERVALUES_API}/v3/markets`, () =>
          HttpResponse.json(MOCK_MARKET_PERFORMERS),
        ),
      );

      const { user } = renderWithReactQuery(<MarketBannerTest />, {
        overrideInitialState: withFlagOverrides({
          lwmWallet40: {
            enabled: true,
            params: { marketBanner: true, aggregatedAssets: true },
          },
        }),
      });

      const tile = await screen.findByTestId("market-banner-tile-0");
      await user.press(tile);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("AssetDetail", {
          screen: "AssetDetail",
          params: {
            currencyId: "bitcoin",
            source: "market_banner",
            marketState: { id: "bitcoin", ledgerIds: ["bitcoin"] },
          },
        });
      });
    });

    it("falls back to MarketDetail when aggregatedAssets is disabled", async () => {
      server.use(
        http.get(`${COUNTERVALUES_API}/v3/markets`, () =>
          HttpResponse.json(MOCK_MARKET_PERFORMERS),
        ),
      );

      const { user } = renderWithReactQuery(<MarketBannerTest />, {
        overrideInitialState: withFlagOverrides({
          lwmWallet40: {
            enabled: true,
            params: { marketBanner: true, aggregatedAssets: false },
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
        overrideInitialState: withFlagOverrides({
          lwmWallet40: { enabled: true, params: { marketBanner: true } },
        }),
      });

      const viewAllTile = await screen.findByTestId("market-banner-view-all");
      await user.press(viewAllTile);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("MarketList");
      });
    });
  });

  describe("Fear and Greed index", () => {
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
        overrideInitialState: withFlagOverrides({
          lwmWallet40: { enabled: true, params: { marketBanner: true } },
        }),
      });

      expect(await screen.findByText(/neutral/i)).toBeVisible();
    });

    it("should not display fear and greed index", async () => {
      server.use(http.get(API_ENDPOINT, () => HttpResponse.json(null, { status: 500 })));

      renderWithReactQuery(<MarketBannerTest />, {
        overrideInitialState: withFlagOverrides({
          lwmWallet40: { enabled: true, params: { marketBanner: true } },
        }),
      });

      expect(await screen.queryByText(/neutral/i)).toBeNull();
    });
  });
});
