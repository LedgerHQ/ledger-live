import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import { server, http, HttpResponse } from "tests/server";
import Market from "../index";
import { Order } from "@ledgerhq/live-common/market/utils/types";
import { MOCK_MARKET_CURRENCY_DATA } from "@ledgerhq/live-common/market/utils/fixtures";

const MARKET_API_ENDPOINT = "https://countervalues.live.ledger.com/v3/markets";

const mockNavigate = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(() => mockNavigate),
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
  overriddenFeatureFlags: {
    lldRefreshMarketData: { enabled: false },
  },
});

describe("Market Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    server.resetHandlers();
  });

  it("should render market page with header", async () => {
    server.use(
      http.get(MARKET_API_ENDPOINT, () => {
        return HttpResponse.json(MOCK_MARKET_CURRENCY_DATA);
      }),
    );

    render(<Market />, {
      initialState: {
        market: createMarketState(),
        settings: createSettingsState(),
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
      initialState: {
        market: createMarketState(),
        settings: createSettingsState(),
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
      initialState: {
        market: createMarketState(),
        settings: createSettingsState(),
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
      initialState: {
        market: createMarketState(),
        settings: createSettingsState(),
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
      initialState: {
        market: createMarketState(),
        settings: createSettingsState(),
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
      initialState: {
        market: createMarketState(),
        settings: createSettingsState(),
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
      initialState: {
        market: createMarketState(),
        settings: createSettingsState(["bitcoin"]),
      },
    });

    await waitFor(() => {
      expect(screen.getByTestId("market-star-button")).toBeInTheDocument();
    });

    const starButton = screen.getByTestId("market-star-button");
    await user.click(starButton);
  });
});
