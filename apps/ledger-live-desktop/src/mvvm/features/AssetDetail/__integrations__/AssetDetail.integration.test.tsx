import React from "react";
import { render, renderWithMockedCounterValuesProvider, screen, waitFor } from "tests/testSetup";
import { MarketMockedResponse } from "tests/handlers/fixtures/market";
import {
  buildDistributionItem,
  makeIntegrationTokenCurrency,
  setupDistributionRouteMocks,
} from "tests/utils/distributionTestUtils";
import { mockMarket, mockDada } from "tests/utils/assetDetailMocks";
import type { DistributionItem } from "@ledgerhq/types-live";
import AssetDetail from "../index";

const LABEL = {
  TOTAL_BALANCE: "Total balance",
  MARKET_STATS: "Market stats",
  PRICE_PERFORMANCE: "Price performance",
  NOT_FOUND: "Asset distribution item not found.",
} as const;

const TEST_ID = {
  HEADER: "asset-detail-header",
  ADDRESS_LIST: "asset-detail-address-list",
} as const;

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useParams: jest.fn(),
  useLocation: jest.fn(() => ({ state: null, pathname: "/asset/bitcoin", search: "", hash: "" })),
}));

jest.mock("~/renderer/actions/general", () => ({
  ...jest.requireActual("~/renderer/actions/general"),
  useDistribution: jest.fn(),
}));

const { useParams, useLocation } = jest.requireMock("react-router");
const { useDistribution } = jest.requireMock("~/renderer/actions/general");

const setupRoute = (
  routeId: string,
  distribution: { bySlug?: Record<string, DistributionItem>; list: DistributionItem[] },
) => setupDistributionRouteMocks(useParams, useDistribution, routeId, distribution);

const setLocation = (state: unknown = null, pathname = "/asset/bitcoin") =>
  useLocation.mockReturnValue({ state, pathname, search: "", hash: "" });

const expectHeader = () => expect(screen.getByTestId(TEST_ID.HEADER)).toBeVisible();
const expectAssetName = (name: string) => expect(screen.getByText(name)).toBeVisible();
const expectMarketView = () => {
  expect(screen.getByRole("heading", { name: LABEL.MARKET_STATS })).toBeVisible();
  expect(screen.getByRole("heading", { name: LABEL.PRICE_PERFORMANCE })).toBeVisible();
};
const expectOwnedView = () => {
  expect(screen.getByText(LABEL.TOTAL_BALANCE)).toBeVisible();
  expect(screen.getByTestId(TEST_ID.ADDRESS_LIST)).toBeVisible();
};
const expectNoMarketView = () =>
  expect(screen.queryByRole("heading", { name: LABEL.MARKET_STATS })).not.toBeInTheDocument();
const expectNoOwnedView = () => {
  expect(screen.queryByText(LABEL.TOTAL_BALANCE)).not.toBeInTheDocument();
  expect(screen.queryByTestId(TEST_ID.ADDRESS_LIST)).not.toBeInTheDocument();
};
const expectNotFound = () => expect(screen.getByText(LABEL.NOT_FOUND)).toBeVisible();

type OwnedAsset = {
  label: string;
  routeId: string;
  displayName: string;
  marketResponse: unknown[];
  buildDistribution: () => { bySlug: Record<string, DistributionItem>; list: DistributionItem[] };
};

const OWNED_ASSETS: OwnedAsset[] = [
  {
    label: "BTC",
    routeId: "bitcoin",
    displayName: "Bitcoin",
    marketResponse: MarketMockedResponse.bitcoinDetail,
    buildDistribution: () => {
      const item = buildDistributionItem();
      return { bySlug: { bitcoin: item }, list: [item] };
    },
  },
  {
    label: "USDC",
    routeId: "ethereum/erc20/usd__coin",
    displayName: "USD Coin",
    marketResponse: MarketMockedResponse.usdcDetail,
    buildDistribution: () => {
      const item = buildDistributionItem({
        currency: makeIntegrationTokenCurrency("ethereum/erc20/usd__coin", "USDC", "USD Coin"),
      });
      return { bySlug: {}, list: [item] };
    },
  },
];

type DiscoveryAsset = {
  label: string;
  routeId: string;
  displayName: string;
  marketResponse: unknown[];
};

const DISCOVERY_ASSETS: DiscoveryAsset[] = [
  {
    label: "BTC",
    routeId: "bitcoin",
    displayName: "Bitcoin",
    marketResponse: MarketMockedResponse.bitcoinDetail,
  },
  {
    label: "USDC",
    routeId: "usd-coin",
    displayName: "USDC",
    marketResponse: MarketMockedResponse.usdcDetail,
  },
];

const LOCATION_STATE_FALLBACK = [
  {
    label: "BTC",
    routeId: "bitcoin",
    displayName: "Bitcoin",
    state: { id: "bitcoin", ledgerIds: ["bitcoin"], name: "Bitcoin", ticker: "BTC", price: 50000 },
  },
  {
    label: "USDC",
    routeId: "usd-coin",
    displayName: "USDC",
    state: {
      id: "usd-coin",
      ledgerIds: ["ethereum/erc20/usd__coin"],
      name: "USDC",
      ticker: "USDC",
      price: 0.999774,
    },
  },
];

const NOT_FOUND_FAILURES: Array<{ description: string; setup: () => void }> = [
  { description: "Market returns empty", setup: () => mockMarket.empty() },
  {
    description: "Market and DADA return network errors",
    setup: () => {
      mockMarket.networkError();
      mockDada.networkError();
    },
  },
  {
    description: "Market and DADA return 500",
    setup: () => {
      mockMarket.fail();
      mockDada.fail();
    },
  },
];

// --- Tests ---

describe("AssetDetail integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setLocation();
  });

  describe("owned mode (with account)", () => {
    it.each(OWNED_ASSETS)(
      "$label - shows balance, addresses and market sections",
      async ({ routeId, displayName, marketResponse, buildDistribution }) => {
        mockMarket.withData(marketResponse);
        setupRoute(routeId, buildDistribution());

        renderWithMockedCounterValuesProvider(<AssetDetail />);

        await waitFor(() => {
          expectHeader();
          expectAssetName(displayName);
          expectOwnedView();
          expectMarketView();
        });
      },
    );

    it.each(OWNED_ASSETS)(
      "$label - keeps balance and addresses when Market and DADA both fail",
      async ({ routeId, buildDistribution }) => {
        mockMarket.fail();
        mockDada.fail();
        setupRoute(routeId, buildDistribution());

        renderWithMockedCounterValuesProvider(<AssetDetail />);

        await waitFor(() => {
          expectHeader();
          expectOwnedView();
        });
        expectNoMarketView();
      },
    );

    it.each(OWNED_ASSETS)(
      "$label - falls back to Market API when DADA fails",
      async ({ routeId, displayName, marketResponse, buildDistribution }) => {
        mockMarket.withData(marketResponse);
        mockDada.fail();
        setupRoute(routeId, buildDistribution());

        renderWithMockedCounterValuesProvider(<AssetDetail />);

        await waitFor(() => {
          expectHeader();
          expectAssetName(displayName);
          expectOwnedView();
          expectMarketView();
        });
      },
    );

    it.each(OWNED_ASSETS)(
      "$label - falls back to DADA when Market API fails",
      async ({ routeId, displayName, buildDistribution }) => {
        mockMarket.fail();
        setupRoute(routeId, buildDistribution());

        renderWithMockedCounterValuesProvider(<AssetDetail />);

        await waitFor(() => {
          expectHeader();
          expectAssetName(displayName);
          expectOwnedView();
          expect(screen.getByRole("heading", { name: LABEL.MARKET_STATS })).toBeVisible();
        });
      },
    );
  });

  describe("discovery mode (no account)", () => {
    it.each(DISCOVERY_ASSETS)(
      "$label - shows header and market sections without owned view",
      async ({ routeId, displayName, marketResponse }) => {
        mockMarket.withData(marketResponse);
        setupRoute(routeId, { list: [] });

        render(<AssetDetail />);

        await waitFor(() => {
          expectHeader();
          expectAssetName(displayName);
          expectMarketView();
        });
        expectNoOwnedView();
      },
    );

    it.each(DISCOVERY_ASSETS)(
      "$label - falls back to Market API when DADA fails",
      async ({ routeId, displayName, marketResponse }) => {
        mockMarket.withData(marketResponse);
        mockDada.fail();
        setupRoute(routeId, { list: [] });

        render(<AssetDetail />);

        await waitFor(() => {
          expectHeader();
          expectAssetName(displayName);
          expectMarketView();
        });
      },
    );

    it.each(LOCATION_STATE_FALLBACK)(
      "$label - falls back to location state when Market is empty",
      async ({ routeId, displayName, state }) => {
        mockMarket.empty();
        setLocation(state, `/asset/${routeId}`);
        setupRoute(routeId, { list: [] });

        render(<AssetDetail />);

        await waitFor(() => {
          expectHeader();
          expectAssetName(displayName);
        });
      },
    );
  });

  describe("loading state", () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it("shows skeleton while waiting for Market response", () => {
      mockMarket.hang();
      setupRoute("unknown-asset", { list: [] });

      render(<AssetDetail />);

      expect(screen.queryByTestId(TEST_ID.HEADER)).not.toBeInTheDocument();
      expect(screen.queryByText(LABEL.NOT_FOUND)).not.toBeInTheDocument();
    });
  });

  describe("not-found state", () => {
    it.each(NOT_FOUND_FAILURES)("renders not-found when $description", async ({ setup }) => {
      setup();
      setupRoute("unknown-asset", { list: [] });

      render(<AssetDetail />);

      await waitFor(() => expectNotFound());
    });
  });

  describe("token route with slashes", () => {
    it("resolves a token with slashes in its route id", async () => {
      mockMarket.withData(MarketMockedResponse.bitcoinDetail);
      const item = buildDistributionItem({
        currency: makeIntegrationTokenCurrency("bitcoin/test", "TBTC", "Bitcoin Test"),
      });
      setupRoute("bitcoin/test", { bySlug: {}, list: [item] });

      renderWithMockedCounterValuesProvider(<AssetDetail />);

      await waitFor(() => {
        expectHeader();
        expectAssetName("Bitcoin Test");
        expect(screen.getByText(LABEL.TOTAL_BALANCE)).toBeVisible();
      });
    });
  });
});
