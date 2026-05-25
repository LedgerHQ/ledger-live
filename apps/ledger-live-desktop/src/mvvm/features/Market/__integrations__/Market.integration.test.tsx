import React from "react";
import { render, renderHook, screen, waitFor, withFlagOverrides } from "tests/testSetup";
import { server, http, HttpResponse } from "tests/server";
import Market from "../index";
import { Order } from "@ledgerhq/live-common/market/utils/types";
import { MOCK_MARKET_CURRENCY_DATA } from "@ledgerhq/live-common/market/utils/fixtures";
import { useMarket } from "LLD/features/Market/hooks/useMarket";

const MARKET_API_ENDPOINT = "https://countervalues.live.ledger.com/v3/markets";

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

jest.mock("../screens/MarketList", () => ({
  __esModule: true,
  default: () => <div data-testid="market-list-data">MarketList</div>,
}));

jest.mock("LLD/features/Market/hooks/useMarket", () => ({
  useMarket: jest.fn(),
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

const { result: topLevelMarketHook } = renderHook(() => useMarket());

describe("Market Integration", () => {
  beforeEach(() => {
    (useMarket as jest.Mock).mockReturnValue({
      ...topLevelMarketHook.current,
      marketParams: { page: 1, range: "24h", counterCurrency: "usd" },
      timeRanges: [],
      supportedCounterCurrencies: [],
      t: (k: string) => k,
    });
    jest.clearAllMocks();
    server.resetHandlers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
      expect(screen.getByText("Market")).toBeInTheDocument();
      expect(screen.getByTestId("market-list-header")).toBeInTheDocument();
    });
  });

  it("should render list, handle search, toggle stars and navigate to sell", async () => {
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
        settings: createSettingsState(["bitcoin"]),
        ...marketFeatureFlagsState,
        accounts: [],
      },
    });

    // list visible
    await waitFor(() => {
      expect(screen.getByTestId("market-list-data")).toBeInTheDocument();
    });

    // search
    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, "bitcoin");

    // toggle star
    const starButton = screen.getByTestId("market-star-button");
    await user.click(starButton);

    // click sell
    const sellButton = screen.getByTestId("market-BTC-sell-button");
    await user.click(sellButton);

    expect(mockNavigate).toHaveBeenCalledWith("/exchange", {
      state: expect.objectContaining({
        currency: "bitcoin",
        mode: "sell",
      }),
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

    expect(screen.getByTestId("market-list-skeleton")).toBeInTheDocument();
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
      expect(screen.getByTestId("market-list-skeleton")).toBeInTheDocument();
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
      expect(screen.getByTestId("market-list-skeleton")).toBeInTheDocument();
      expect(screen.queryByTestId("market-list-data")).toBeNull();
    });
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
      expect(screen.getByTestId("market-list-data")).toBeInTheDocument();
    });

    const sellButton = screen.getByTestId("market-BTC-sell-button");
    expect(sellButton).toBeInTheDocument();
    expect(sellButton).toBeInTheDocument();
  });
});
