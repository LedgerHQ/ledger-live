import React from "react";
import { render, screen, waitFor, withFlagOverrides } from "tests/testSetup";
import { server, http, HttpResponse } from "tests/server";
import Market from "../index";
import { Order } from "@ledgerhq/live-common/market/utils/types";
import { MOCK_MARKET_CURRENCY_DATA } from "@ledgerhq/live-common/market/utils/fixtures";

const MARKET_API_ENDPOINT = "https://countervalues.live.ledger.com/v3/markets";
const TRENDING_CATEGORIES_ENDPOINT = "https://countervalues.live.ledger.com/v3/categories/trending";

const mockNavigate = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(() => mockNavigate),
}));

jest.mock("@ledgerhq/live-common/modularDrawer/hooks/useCurrenciesUnderFeatureFlag", () => ({
  useCurrenciesUnderFeatureFlag: () => ({
    deactivatedCurrencyIds: new Set<string>(),
  }),
}));

const LIST_ITEM_HEIGHT = 73;

jest.mock("LLD/features/Market/hooks/useMarketListVirtualization.ts", () => ({
  useMarketListVirtualization: ({
    itemCount,
    marketData = [],
  }: {
    itemCount: number;
    marketData?: { length: number }[];
  }) => {
    const createVirtualizer = () => ({
      getVirtualItems: () =>
        Array.from({ length: Math.min(itemCount, marketData?.length ?? 0) }, (_, i) => ({
          index: i,
          start: i * LIST_ITEM_HEIGHT,
          size: LIST_ITEM_HEIGHT,
          key: i,
        })),
      getTotalSize: () => (marketData?.length ?? 0) * LIST_ITEM_HEIGHT,
    });
    return {
      parentRef: { current: null },
      rowVirtualizer: createVirtualizer(),
    };
  },
}));

const createMarketState = (overrides = {}) => ({
  marketParams: {
    starred: [],
    range: "24h",
    limit: 50,
    order: Order.MarketCapDesc,
    search: "",
    liveCompatible: false,
    page: 1,
    counterCurrency: "usd",
    ...overrides,
  },
  currentPage: 1,
});

const createSettingsState = (starredMarketCoins: string[] = []) => ({
  starredMarketCoins,
  supportedCounterValues: [
    {
      value: "usd",
      label: "US Dollar - USD",
      currency: {
        type: "FiatCurrency",
        ticker: "USD",
        name: "US Dollar",
        symbol: "$",
        units: [
          {
            code: "$",
            name: "US Dollar",
            magnitude: 2,
            showAllDigits: true,
            prefixCode: true,
          },
        ],
      },
    },
    {
      value: "eur",
      label: "Euro - EUR",
      currency: {
        type: "FiatCurrency",
        ticker: "EUR",
        name: "Euro",
        symbol: "€",
        units: [
          {
            code: "€",
            name: "Euro",
            magnitude: 2,
            showAllDigits: true,
            prefixCode: true,
          },
        ],
      },
    },
  ],
});

const marketFeatureFlagsState = withFlagOverrides({ lldRefreshMarketData: { enabled: false } });

const marketWithTopCardsOn = withFlagOverrides({
  lldRefreshMarketData: { enabled: false },
  lwdWallet40: { enabled: true, params: { assetDiscoverability: true } },
});

const marketWithTopCardsOff = withFlagOverrides({
  lldRefreshMarketData: { enabled: false },
  lwdWallet40: { enabled: false },
});

describe("Market Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    server.resetHandlers();
  });

  it("should render top cards section when assetDiscoverability is enabled", async () => {
    server.use(
      http.get(MARKET_API_ENDPOINT, () => {
        return HttpResponse.json(MOCK_MARKET_CURRENCY_DATA);
      }),
    );

    render(<Market />, {
      withRampCatalog: true,
      initialState: {
        market: createMarketState(),
        settings: createSettingsState(),
        ...marketWithTopCardsOn,
      },
    });

    await waitFor(() => {
      expect(screen.getByRole("region", { name: /market top cards/i })).toBeVisible();
      expect(screen.getByTestId("market-top-card-1")).toBeVisible();
      expect(screen.getByTestId("market-top-card-2")).toBeVisible();
      expect(screen.getByTestId("market-top-card-3")).toBeVisible();
    });
  });

  it("should not render top cards section when assetDiscoverability is disabled", async () => {
    server.use(
      http.get(MARKET_API_ENDPOINT, () => {
        return HttpResponse.json(MOCK_MARKET_CURRENCY_DATA);
      }),
    );

    render(<Market />, {
      withRampCatalog: true,
      initialState: {
        market: createMarketState(),
        settings: createSettingsState(),
        ...marketWithTopCardsOff,
      },
    });

    await waitFor(() => {
      expect(screen.getByText("Market")).toBeVisible();
    });

    expect(screen.queryByRole("region", { name: /market top cards/i })).toBeNull();
  });

  it("should render market page with header", async () => {
    server.use(
      http.get(MARKET_API_ENDPOINT, () => {
        return HttpResponse.json(MOCK_MARKET_CURRENCY_DATA);
      }),
    );

    render(<Market />, {
      withRampCatalog: true,
      initialState: {
        market: createMarketState(),
        settings: createSettingsState(),
        ...marketFeatureFlagsState,
      },
    });

    await waitFor(() => {
      expect(screen.getByText("Market")).toBeVisible();
      expect(screen.getByTestId("market-list-header")).toBeVisible();
    });
  });

  it("should render market list when data is loaded", async () => {
    server.use(
      http.get(MARKET_API_ENDPOINT, () => {
        return HttpResponse.json(MOCK_MARKET_CURRENCY_DATA);
      }),
    );

    render(<Market />, {
      withRampCatalog: true,
      initialState: {
        market: createMarketState(),
        settings: createSettingsState(),
        ...marketFeatureFlagsState,
      },
    });

    await waitFor(() => {
      expect(screen.getByTestId("market-list-data")).toBeVisible();
    });
  });

  it("should show skeleton when loading", () => {
    server.use(
      http.get(MARKET_API_ENDPOINT, () => {
        return new Promise(() => {
          // Never resolves to simulate loading
        });
      }),
    );

    render(<Market />, {
      withRampCatalog: true,
      initialState: {
        market: createMarketState(),
        settings: createSettingsState(),
        ...marketFeatureFlagsState,
      },
    });

    // Skeleton should be visible during loading
    expect(screen.getByTestId("market-list-skeleton")).toBeVisible();
    expect(screen.queryByTestId("market-list-data")).toBeNull();
  });

  it("should show skeleton when API returns an error", async () => {
    server.use(
      http.get(MARKET_API_ENDPOINT, () => {
        return HttpResponse.json({ error: "Internal Server Error" }, { status: 500 });
      }),
    );

    render(<Market />, {
      withRampCatalog: true,
      initialState: {
        market: createMarketState(),
        settings: createSettingsState(),
        ...marketFeatureFlagsState,
      },
    });

    await waitFor(() => {
      // Skeleton should be visible when there's an error
      expect(screen.getByTestId("market-list-skeleton")).toBeVisible();
      expect(screen.queryByTestId("market-list-data")).toBeNull();
    });
  });

  it("should show skeleton when API request fails with network error", async () => {
    server.use(
      http.get(MARKET_API_ENDPOINT, () => {
        return HttpResponse.error();
      }),
    );

    render(<Market />, {
      withRampCatalog: true,
      initialState: {
        market: createMarketState(),
        settings: createSettingsState(),
        ...marketFeatureFlagsState,
      },
    });

    await waitFor(() => {
      // Skeleton should be visible when there's a network error
      expect(screen.getByTestId("market-list-skeleton")).toBeVisible();
      expect(screen.queryByTestId("market-list-data")).toBeNull();
    });
  });

  it("should handle search functionality", async () => {
    server.use(
      http.get(MARKET_API_ENDPOINT, ({ request }) => {
        const url = new URL(request.url);
        const search = url.searchParams.get("filter");

        if (search === "bitcoin") {
          return HttpResponse.json([MOCK_MARKET_CURRENCY_DATA[0]]);
        }
        return HttpResponse.json(MOCK_MARKET_CURRENCY_DATA);
      }),
    );

    const { user } = render(<Market />, {
      withRampCatalog: true,
      initialState: {
        market: createMarketState(),
        settings: createSettingsState(),
        ...marketFeatureFlagsState,
      },
    });

    await waitFor(() => {
      expect(screen.getByTestId("market-list-data")).toBeVisible();
      expect(screen.queryByTestId("market-list-skeleton")).toBeNull();
    });

    const searchInput = screen.getByPlaceholderText(/search/i);
    if (searchInput) {
      await user.type(searchInput, "bitcoin");
    }
  });

  it("should toggle starred filter", async () => {
    server.use(
      http.get(MARKET_API_ENDPOINT, () => {
        return HttpResponse.json(MOCK_MARKET_CURRENCY_DATA);
      }),
    );

    const { user } = render(<Market />, {
      withRampCatalog: true,
      initialState: {
        market: createMarketState(),
        settings: createSettingsState(["bitcoin"]),
        ...marketFeatureFlagsState,
      },
    });

    await waitFor(() => {
      expect(screen.getByTestId("market-star-button")).toBeInTheDocument();
    });

    const starButton = screen.getByTestId("market-star-button");
    await user.click(starButton);
  });

  it("should show sell button when currency is available for selling", async () => {
    server.use(
      http.get(MARKET_API_ENDPOINT, () => {
        return HttpResponse.json(MOCK_MARKET_CURRENCY_DATA);
      }),
    );

    render(<Market />, {
      withRampCatalog: true,
      initialState: {
        market: createMarketState(),
        settings: createSettingsState(),
        ...marketFeatureFlagsState,
      },
    });

    await waitFor(() => {
      expect(screen.getByTestId("market-list-data")).toBeVisible();
    });

    const sellButton = screen.getByTestId("market-BTC-sell-button");
    expect(sellButton).toBeInTheDocument();
    expect(sellButton).toBeVisible();
  });

  it("should append trending categories after the built-in tabs and filter the list when selected", async () => {
    const marketRequests: URL[] = [];

    server.use(
      http.get(TRENDING_CATEGORIES_ENDPOINT, () => {
        return HttpResponse.json([{ id: "infrastructure", name: "Infrastructure" }]);
      }),
      http.get(MARKET_API_ENDPOINT, ({ request }) => {
        marketRequests.push(new URL(request.url));
        return HttpResponse.json(MOCK_MARKET_CURRENCY_DATA);
      }),
    );

    const { user } = render(<Market />, {
      withRampCatalog: true,
      initialState: {
        market: createMarketState(),
        settings: createSettingsState(),
        ...marketWithTopCardsOn,
      },
    });

    const trendingChip = await screen.findByTestId("market-category-switcher-infrastructure");
    expect(trendingChip).toHaveTextContent("Infrastructure");
    expect(screen.getByTestId("market-category-switcher-all")).toBeVisible();
    expect(screen.getByTestId("market-category-switcher-stocks")).toBeVisible();
    expect(screen.getByTestId("market-category-switcher-starred")).toBeVisible();

    await user.click(trendingChip);

    await waitFor(() => {
      expect(
        marketRequests.some(url => url.searchParams.get("categories") === "infrastructure"),
      ).toBe(true);
    });
  });

  it("should navigate to exchange with sell state when sell button is clicked", async () => {
    server.use(
      http.get(MARKET_API_ENDPOINT, () => {
        return HttpResponse.json(MOCK_MARKET_CURRENCY_DATA);
      }),
    );

    const { user } = render(<Market />, {
      withRampCatalog: true,
      initialState: {
        market: createMarketState(),
        settings: createSettingsState(),
        ...marketFeatureFlagsState,
        accounts: [],
      },
    });

    await waitFor(() => {
      expect(screen.getByTestId("market-BTC-sell-button")).toBeVisible();
    });

    const sellButton = screen.getByTestId("market-BTC-sell-button");
    await user.click(sellButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/exchange", {
        state: expect.objectContaining({
          currency: "bitcoin",
          mode: "sell",
        }),
      });
    });
  });
});
