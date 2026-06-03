import React from "react";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import {
  fireEvent,
  render,
  renderWithMockedCounterValuesProvider,
  screen,
  waitFor,
  within,
  withFlagOverrides,
} from "tests/testSetup";
import { MarketMockedResponse } from "tests/handlers/fixtures/market";
import {
  buildDistributionItem,
  makeIntegrationTokenCurrency,
  setupDistributionRouteMocks,
} from "tests/utils/distributionTestUtils";
import { hoverChartSvg, mockLumenChartResizeObserver } from "tests/utils/lumenChartTestUtils";
import { mockDada, mockMarket } from "tests/utils/assetDetailMocks";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import type { DistributionItem } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import AssetDetail from "../index";
import { MAX_ADDRESSES_PREVIEW } from "../components/AddressList/constants";

const LABEL = {
  TOTAL_BALANCE: "Total balance",
  MARKET_STATS: "Market stats",
  PRICE_PERFORMANCE: "Price performance",
  NOT_FOUND: "Asset distribution item not found.",
} as const;

const TEST_ID = {
  HEADER: "asset-detail-header",
  ADDRESS_LIST: "asset-detail-address-list",
  ADDRESSES_SEE_ALL: "asset-detail-addresses-see-all",
  MARKET_PRICE_SECTION: "asset-detail-market-price-section",
  MARKET_PRICE: "asset-detail-market-price",
  MARKET_PRICE_PERCENT: "asset-detail-market-price-percent",
  MARKET_PRICE_FIAT_VARIATION: "asset-detail-market-price-fiat-variation",
  MARKET_DATA_SECTION: "asset-detail-market-data-section",
  CHART_SECTION: "asset-detail-chart-section",
  LINE_CHART_RANGE_DEFAULT: "line-chart-range-1d",
  LINE_CHART_RANGE_ONE_YEAR: "line-chart-range-1y",
  TRANSACTIONS_SECTION: "asset-detail-transactions-section",
  ACTION_BAR: "asset-detail-action-bar",
  ACTION_BUY: "asset-detail-action-buy",
  ACTION_RECEIVE: "asset-detail-action-receive",
  ACTION_SELL: "asset-detail-action-sell",
  ACTION_SEND: "asset-detail-action-send",
  HEADER_OPTIONS: "asset-detail-header-options-trigger",
  STAKING_SECTION: "asset-detail-staking-section",
  EARN_BANNER: "asset-detail-earn-banner",
  AVAILABLE_BALANCE: "asset-detail-available-balance",
  EARN_DEPOSIT: "asset-detail-earn-deposit",
  HIDDEN_BANNER: "asset-detail-hidden-banner",
  HIDDEN_BANNER_SHOW_ASSET: "asset-detail-hidden-banner-show-asset",
} as const;

const mockGetCanStakeCurrency = jest.fn().mockReturnValue(false);
const mockUseInterestRatesByCurrencies = jest.fn().mockReturnValue({});
const mockStartStakeFlow = jest.fn();

jest.mock("LLD/hooks/useStake", () => ({
  useStake: () => ({ getCanStakeCurrency: mockGetCanStakeCurrency }),
}));

jest.mock("~/renderer/screens/stake", () => () => mockStartStakeFlow);

jest.mock("@ledgerhq/live-common/dada-client/hooks/useInterestRatesByCurrencies", () => ({
  useInterestRatesByCurrencies: (...args: unknown[]) => mockUseInterestRatesByCurrencies(...args),
}));

jest.mock("@ledgerhq/live-common/modularDrawer/hooks/useCurrenciesUnderFeatureFlag", () => ({
  useCurrenciesUnderFeatureFlag: () => ({
    deactivatedCurrencyIds: new Set<string>(),
  }),
}));

jest.mock("@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog");

const mockIsCurrencyAvailable = jest.fn((_currencyId: string, _mode: "onRamp" | "offRamp") => true);

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
const btc = getCryptoCurrencyById("bitcoin");

const setupRoute = (
  routeId: string,
  distribution: { bySlug?: Record<string, DistributionItem>; list: DistributionItem[] },
) => setupDistributionRouteMocks(useParams, useDistribution, routeId, distribution);

const setLocation = (state: unknown = null, pathname = "/asset/bitcoin") =>
  useLocation.mockReturnValue({ state, pathname, search: "", hash: "" });

const expectHeader = () => expect(screen.getByTestId(TEST_ID.HEADER)).toBeVisible();
const expectAssetTicker = (ticker: string) => {
  const header = screen.getByTestId(TEST_ID.HEADER);
  expect(header).toBeVisible();
  expect(within(header).getByText(ticker)).toBeVisible();
};
const expectMarketView = () => {
  expect(screen.getByTestId(TEST_ID.MARKET_PRICE_SECTION)).toBeVisible();
  expect(screen.getByTestId(TEST_ID.MARKET_DATA_SECTION)).toBeVisible();
  expect(screen.getByRole("heading", { name: LABEL.MARKET_STATS })).toBeVisible();
  expect(screen.getByRole("heading", { name: LABEL.PRICE_PERFORMANCE })).toBeVisible();
};

const expectMarketPriceSectionShowsQuote = () => {
  expect(screen.getByTestId(TEST_ID.MARKET_PRICE)).toHaveTextContent(/\S/);
  expect(screen.getByTestId(TEST_ID.MARKET_PRICE_PERCENT)).not.toHaveTextContent(
    /^-0(?:[.,]0+)?%$/,
  );
  expect(screen.getByTestId(TEST_ID.MARKET_PRICE_FIAT_VARIATION)).not.toHaveTextContent(/^—$/);
};

const waitForMarketPriceSectionShowsQuote = () =>
  waitFor(() => {
    expectMarketPriceSectionShowsQuote();
  });
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
const expectActionBarHidden = () =>
  expect(screen.queryByTestId(TEST_ID.ACTION_BAR)).not.toBeInTheDocument();

type OwnedAsset = {
  label: string;
  routeId: string;
  ticker: string;
  marketResponse: unknown[];
  buildDistribution: () => { bySlug: Record<string, DistributionItem>; list: DistributionItem[] };
};

const OWNED_ASSETS: OwnedAsset[] = [
  {
    label: "BTC",
    routeId: "bitcoin",
    ticker: "BTC",
    marketResponse: MarketMockedResponse.bitcoinDetail,
    buildDistribution: () => {
      const account = genAccount("asset-detail-btc-account", { currency: btc });
      const item = buildDistributionItem({ accounts: [account] });
      return { bySlug: { bitcoin: item }, list: [item] };
    },
  },
  {
    label: "USDC",
    routeId: "ethereum/erc20/usd__coin",
    ticker: "USDC",
    marketResponse: MarketMockedResponse.usdcDetail,
    buildDistribution: () => {
      const account = genAccount("asset-detail-usdc-account", { currency: btc });
      const item = buildDistributionItem({
        currency: makeIntegrationTokenCurrency("ethereum/erc20/usd__coin", "USDC", "USD Coin"),
        accounts: [account],
      });
      return { bySlug: {}, list: [item] };
    },
  },
];

type DiscoveryAsset = {
  label: string;
  routeId: string;
  ticker: string;
  marketResponse: unknown[];
};

const DISCOVERY_ASSETS: DiscoveryAsset[] = [
  {
    label: "BTC",
    routeId: "bitcoin",
    ticker: "BTC",
    marketResponse: MarketMockedResponse.bitcoinDetail,
  },
  {
    label: "USDC",
    routeId: "usd-coin",
    ticker: "USDC",
    marketResponse: MarketMockedResponse.usdcDetail,
  },
];

const LOCATION_STATE_FALLBACK = [
  {
    label: "BTC",
    routeId: "bitcoin",
    ticker: "BTC",
    state: { id: "bitcoin", ledgerIds: ["bitcoin"], name: "Bitcoin", ticker: "BTC", price: 50000 },
  },
  {
    label: "USDC",
    routeId: "usd-coin",
    ticker: "USDC",
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
    mockGetCanStakeCurrency.mockReturnValue(false);
    mockUseInterestRatesByCurrencies.mockReturnValue({});

    mockIsCurrencyAvailable.mockImplementation(() => true);
    jest.mocked(useRampCatalog).mockReturnValue({
      isCurrencyAvailable: mockIsCurrencyAvailable,
      getSupportedCryptoCurrencyIds: () => null,
    } as unknown as ReturnType<typeof useRampCatalog>);
  });

  describe("owned mode (with account)", () => {
    it.each(OWNED_ASSETS)(
      "$label - shows balance, addresses and market sections",
      async ({ routeId, ticker, marketResponse, buildDistribution }) => {
        mockMarket.withData(marketResponse);
        setupRoute(routeId, buildDistribution());

        renderWithMockedCounterValuesProvider(<AssetDetail />);

        await waitFor(() => {
          expectHeader();
          expectAssetTicker(ticker);
          expectOwnedView();
          expectMarketView();
        });
        await waitForMarketPriceSectionShowsQuote();
      },
    );

    it("hides the staking section when the asset is not stakeable", async () => {
      mockMarket.withData(MarketMockedResponse.bitcoinDetail);
      setupRoute("bitcoin", OWNED_ASSETS[0].buildDistribution());

      renderWithMockedCounterValuesProvider(<AssetDetail />);

      await waitFor(() => {
        expectHeader();
        expectOwnedView();
      });

      expect(screen.queryByTestId(TEST_ID.STAKING_SECTION)).not.toBeInTheDocument();
    });

    it("shows the default earn banner when stakeable without an earn deposit and no APY", async () => {
      mockGetCanStakeCurrency.mockReturnValue(true);
      mockMarket.withData(MarketMockedResponse.bitcoinDetail);
      setupRoute("bitcoin", OWNED_ASSETS[0].buildDistribution());

      renderWithMockedCounterValuesProvider(<AssetDetail />);

      await waitFor(() => {
        expect(screen.getByTestId(TEST_ID.EARN_BANNER)).toBeVisible();
        expect(screen.getByText("Earn with this asset")).toBeVisible();
      });

      expect(screen.queryByTestId(TEST_ID.AVAILABLE_BALANCE)).not.toBeInTheDocument();
      expect(screen.queryByTestId(TEST_ID.EARN_DEPOSIT)).not.toBeInTheDocument();
    });

    it("shows the earn banner when the asset is stakeable without an earn deposit and APY is available", async () => {
      mockGetCanStakeCurrency.mockReturnValue(true);
      mockUseInterestRatesByCurrencies.mockReturnValue({
        bitcoin: { value: 0.12, type: "APY" },
      });
      mockMarket.withData(MarketMockedResponse.bitcoinDetail);
      setupRoute("bitcoin", OWNED_ASSETS[0].buildDistribution());

      renderWithMockedCounterValuesProvider(<AssetDetail />);

      await waitFor(() => {
        expect(screen.getByTestId(TEST_ID.EARN_BANNER)).toBeVisible();
        expect(screen.getByText("Earn up to 12.0% APY")).toBeVisible();
      });

      expect(screen.queryByTestId(TEST_ID.AVAILABLE_BALANCE)).not.toBeInTheDocument();
      expect(screen.queryByTestId(TEST_ID.EARN_DEPOSIT)).not.toBeInTheDocument();
    });

    it("shows the earn banner when stakeable with a zero-balance account", async () => {
      mockGetCanStakeCurrency.mockReturnValue(true);
      mockMarket.withData(MarketMockedResponse.bitcoinDetail);
      const account = genAccount("asset-detail-staking-zero-balance", { currency: btc });
      account.balance = new BigNumber(0);
      account.spendableBalance = new BigNumber(0);
      const item = buildDistributionItem({ accounts: [account], amount: 0, countervalue: 0 });
      setupRoute("bitcoin", { bySlug: { bitcoin: item }, list: [item] });

      renderWithMockedCounterValuesProvider(<AssetDetail />);

      await waitFor(() => {
        expect(screen.getByTestId(TEST_ID.EARN_BANNER)).toBeVisible();
        expect(screen.getByText("Earn with this asset")).toBeVisible();
      });

      expect(screen.queryByTestId(TEST_ID.AVAILABLE_BALANCE)).not.toBeInTheDocument();
      expect(screen.queryByTestId(TEST_ID.EARN_DEPOSIT)).not.toBeInTheDocument();
    });

    it("shows available balance and earn deposit cards when stakeable with an earn deposit", async () => {
      mockGetCanStakeCurrency.mockReturnValue(true);
      mockMarket.withData(MarketMockedResponse.bitcoinDetail);
      const account = genAccount("asset-detail-staking-deposit", { currency: btc });
      account.balance = new BigNumber(10);
      account.spendableBalance = new BigNumber(0);
      const item = buildDistributionItem({ accounts: [account] });
      setupRoute("bitcoin", { bySlug: { bitcoin: item }, list: [item] });

      renderWithMockedCounterValuesProvider(<AssetDetail />);

      await waitFor(() => {
        expect(screen.getByTestId(TEST_ID.AVAILABLE_BALANCE)).toBeVisible();
        expect(screen.getByTestId(TEST_ID.EARN_DEPOSIT)).toBeVisible();
      });

      expect(screen.queryByTestId(TEST_ID.EARN_BANNER)).not.toBeInTheDocument();
    });

    describe("chart section", () => {
      const originalResizeObserver = global.ResizeObserver;

      beforeEach(() => {
        mockLumenChartResizeObserver();
      });

      afterEach(() => {
        global.ResizeObserver = originalResizeObserver;
      });

      it("renders with the 1D range selected by default and switches range on click", async () => {
        mockMarket.withData(MarketMockedResponse.bitcoinDetail);
        setupRoute("bitcoin", OWNED_ASSETS[0].buildDistribution());

        const { user } = renderWithMockedCounterValuesProvider(<AssetDetail />);

        await waitFor(() => {
          expect(screen.getByTestId(TEST_ID.CHART_SECTION)).toBeVisible();
          expect(screen.getByTestId(TEST_ID.LINE_CHART_RANGE_DEFAULT)).toBeVisible();
        });

        const defaultRange = screen.getByTestId(TEST_ID.LINE_CHART_RANGE_DEFAULT);
        expect(defaultRange).toHaveAttribute("aria-checked", "true");

        const oneYearRange = screen.getByTestId(TEST_ID.LINE_CHART_RANGE_ONE_YEAR);
        expect(oneYearRange).toHaveAttribute("aria-checked", "false");

        await user.click(oneYearRange);

        await waitFor(() => {
          expect(screen.getByTestId(TEST_ID.LINE_CHART_RANGE_ONE_YEAR)).toHaveAttribute(
            "aria-checked",
            "true",
          );
        });
        expect(screen.getByTestId(TEST_ID.LINE_CHART_RANGE_DEFAULT)).toHaveAttribute(
          "aria-checked",
          "false",
        );
      });

      it("updates the market price section variation when the chart range changes", async () => {
        mockMarket.withData(MarketMockedResponse.bitcoinDetail);
        setupRoute("bitcoin", OWNED_ASSETS[0].buildDistribution());

        const { user } = renderWithMockedCounterValuesProvider(<AssetDetail />);

        await waitForMarketPriceSectionShowsQuote();

        const section = screen.getByTestId(TEST_ID.MARKET_PRICE_SECTION);
        expect(within(section).getByText("1 day")).toBeVisible();
        // BTC fixture has a negative 24h change.
        expect(screen.getByTestId(TEST_ID.MARKET_PRICE_PERCENT)).toHaveTextContent(/^-/);

        const oneYearRange = await screen.findByTestId(TEST_ID.LINE_CHART_RANGE_ONE_YEAR);
        await user.click(oneYearRange);

        await waitFor(() => {
          expect(within(section).getByText("1 year")).toBeVisible();
        });
        // BTC fixture has a +118.89% 1y change.
        expect(screen.getByTestId(TEST_ID.MARKET_PRICE_PERCENT)).toHaveTextContent(/^\+/);
      });

      it("renders the price chart with min/max markers and x-axis only", async () => {
        mockMarket.withData(MarketMockedResponse.bitcoinDetail);
        setupRoute("bitcoin", OWNED_ASSETS[0].buildDistribution());

        renderWithMockedCounterValuesProvider(<AssetDetail />);

        const section = await screen.findByTestId(TEST_ID.CHART_SECTION);

        await waitFor(() => {
          expect(within(section).getByTestId("chart-svg")).toBeVisible();
        });

        expect(within(section).queryByTestId("y-axis")).not.toBeInTheDocument();
        expect(within(section).getByTestId("x-axis")).toBeVisible();
        expect(within(section).getAllByTestId("point-group")).toHaveLength(2);
      });

      it("shows the scrubber without a tooltip when hovering the chart", async () => {
        mockMarket.withData(MarketMockedResponse.bitcoinDetail);
        setupRoute("bitcoin", OWNED_ASSETS[0].buildDistribution());

        renderWithMockedCounterValuesProvider(<AssetDetail />);

        const section = await screen.findByTestId(TEST_ID.CHART_SECTION);
        const chart = await waitFor(() => within(section).getByTestId("chart-svg"));

        hoverChartSvg(chart);

        await waitFor(() => {
          expect(within(section).getByTestId("scrubber")).toBeVisible();
        });
        // The scrubbed price/date is surfaced in the market price section instead.
        expect(within(section).queryByTestId("chart-tooltip")).not.toBeInTheDocument();
      });

      it("drives the market price section from the scrubbed point and reverts on leave", async () => {
        mockMarket.withData(MarketMockedResponse.bitcoinDetail);
        setupRoute("bitcoin", OWNED_ASSETS[0].buildDistribution());

        renderWithMockedCounterValuesProvider(<AssetDetail />);

        await waitForMarketPriceSectionShowsQuote();

        const priceSection = screen.getByTestId(TEST_ID.MARKET_PRICE_SECTION);
        const livePrice = screen.getByTestId(TEST_ID.MARKET_PRICE).textContent;
        const livePercent = screen.getByTestId(TEST_ID.MARKET_PRICE_PERCENT).textContent;
        const liveFiatVariation = screen.getByTestId(
          TEST_ID.MARKET_PRICE_FIAT_VARIATION,
        ).textContent;
        expect(within(priceSection).getByText("1 day")).toBeVisible();

        const chartSection = screen.getByTestId(TEST_ID.CHART_SECTION);
        const chart = await waitFor(() => within(chartSection).getByTestId("chart-svg"));

        hoverChartSvg(chart);

        // While scrubbing, the trailing range label is replaced by the hovered
        // point's date, the displayed price tracks the scrubbed value, and the
        // % / fiat variation reflect the change from the range start.
        await waitFor(() => {
          expect(within(priceSection).queryByText("1 day")).not.toBeInTheDocument();
          expect(screen.getByTestId(TEST_ID.MARKET_PRICE).textContent).not.toBe(livePrice);
        });
        expect(screen.getByTestId(TEST_ID.MARKET_PRICE_PERCENT)).toBeVisible();
        expect(screen.getByTestId(TEST_ID.MARKET_PRICE_FIAT_VARIATION)).toBeVisible();
        expect(screen.getByTestId(TEST_ID.MARKET_PRICE_PERCENT).textContent).not.toBe(livePercent);
        expect(screen.getByTestId(TEST_ID.MARKET_PRICE_FIAT_VARIATION).textContent).not.toBe(
          liveFiatVariation,
        );

        fireEvent.mouseLeave(chart);

        // Leaving the chart reverts to the live price, range label and variation.
        // The amount re-enables its animation on revert, so wait for it to settle.
        await waitFor(() => {
          expect(within(priceSection).getByText("1 day")).toBeVisible();
          expect(screen.getByTestId(TEST_ID.MARKET_PRICE).textContent).toBe(livePrice);
          expect(screen.getByTestId(TEST_ID.MARKET_PRICE_PERCENT).textContent).toBe(livePercent);
          expect(screen.getByTestId(TEST_ID.MARKET_PRICE_FIAT_VARIATION).textContent).toBe(
            liveFiatVariation,
          );
        });
      });
    });

    describe("addresses see all", () => {
      it("opens the all addresses dialog when see all is clicked", async () => {
        mockMarket.withData(MarketMockedResponse.bitcoinDetail);
        const accounts = Array.from({ length: MAX_ADDRESSES_PREVIEW + 1 }, (_, index) =>
          genAccount(`asset-detail-addresses-see-all-${index}`, { currency: btc }),
        );
        const item = buildDistributionItem({ accounts });
        setupRoute("bitcoin", { bySlug: { bitcoin: item }, list: [item] });

        const { user } = renderWithMockedCounterValuesProvider(<AssetDetail />, {
          initialState: { accounts },
        });

        await waitFor(() => {
          expect(screen.getByTestId(TEST_ID.ADDRESS_LIST)).toBeVisible();
        });

        expect(screen.getAllByTestId(/asset-detail-address-row-/)).toHaveLength(
          MAX_ADDRESSES_PREVIEW,
        );
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

        await user.click(screen.getByTestId(TEST_ID.ADDRESSES_SEE_ALL));

        const dialog = await screen.findByRole("dialog");
        expect(within(dialog).getByRole("heading", { name: "Addresses" })).toBeVisible();
        expect(
          within(dialog).getAllByText(/all your addresses holding btc\./i).length,
        ).toBeGreaterThan(0);
        expect(within(dialog).getAllByTestId(/asset-detail-address-row-/)).toHaveLength(
          MAX_ADDRESSES_PREVIEW + 1,
        );
      });

      it("does not show see all when there are five or fewer addresses", async () => {
        mockMarket.withData(MarketMockedResponse.bitcoinDetail);
        const accounts = Array.from({ length: MAX_ADDRESSES_PREVIEW }, (_, index) =>
          genAccount(`asset-detail-addresses-no-see-all-${index}`, { currency: btc }),
        );
        const item = buildDistributionItem({ accounts });
        setupRoute("bitcoin", { bySlug: { bitcoin: item }, list: [item] });

        renderWithMockedCounterValuesProvider(<AssetDetail />, {
          initialState: { accounts },
        });

        await waitFor(() => {
          expect(screen.getByTestId(TEST_ID.ADDRESS_LIST)).toBeVisible();
        });

        expect(screen.queryByTestId(TEST_ID.ADDRESSES_SEE_ALL)).not.toBeInTheDocument();
        expect(screen.getAllByTestId(/asset-detail-address-row-/)).toHaveLength(
          MAX_ADDRESSES_PREVIEW,
        );
      });
    });

    it("shows header options menu with favorites and hide actions for tokens", async () => {
      mockMarket.withData(MarketMockedResponse.usdcDetail);
      setupRoute("ethereum/erc20/usd__coin", OWNED_ASSETS[1].buildDistribution());

      const { user } = renderWithMockedCounterValuesProvider(<AssetDetail />);

      await waitFor(() => {
        expect(screen.getByTestId(TEST_ID.HEADER_OPTIONS)).toBeVisible();
      });

      await user.click(screen.getByTestId(TEST_ID.HEADER_OPTIONS));

      expect(screen.getByRole("menuitem", { name: /add to favorites/i })).toBeVisible();
      expect(screen.getByRole("menuitem", { name: /hide from portfolio/i })).toBeVisible();
    });

    it("offers Hide from portfolio for an owned coin (BTC) now that the action is no longer token-only", async () => {
      mockMarket.withData(MarketMockedResponse.bitcoinDetail);
      setupRoute("bitcoin", OWNED_ASSETS[0].buildDistribution());

      const { user } = renderWithMockedCounterValuesProvider(<AssetDetail />);

      await waitFor(() => {
        expect(screen.getByTestId(TEST_ID.HEADER_OPTIONS)).toBeVisible();
      });

      await user.click(screen.getByTestId(TEST_ID.HEADER_OPTIONS));

      expect(screen.getByRole("menuitem", { name: /hide from portfolio/i })).toBeVisible();
    });

    it("USDC - enables the favorite action and stores the coingecko id when toggled", async () => {
      mockMarket.withData(MarketMockedResponse.usdcDetail);
      const account = genAccount("asset-detail-usdc-star-account", { currency: btc });
      const item = buildDistributionItem({
        currency: makeIntegrationTokenCurrency("ethereum/erc20/usd__coin", "USDC", "USD Coin"),
        accounts: [account],
        slug: "usd-coin",
      });
      setupRoute("ethereum/erc20/usd__coin", { bySlug: {}, list: [item] });

      const { user, store } = renderWithMockedCounterValuesProvider(<AssetDetail />);

      await waitFor(() => {
        expect(screen.getByTestId(TEST_ID.HEADER_OPTIONS)).toBeVisible();
      });

      await user.click(screen.getByTestId(TEST_ID.HEADER_OPTIONS));

      const favoriteItem = await screen.findByRole("menuitem", { name: /add to favorites/i });
      expect(favoriteItem).toBeVisible();
      expect(favoriteItem).not.toHaveAttribute("aria-disabled", "true");

      await user.click(favoriteItem);

      await waitFor(() => {
        expect(store.getState().settings.starredMarketCoins).toContain("usd-coin");
      });
      expect(store.getState().settings.starredMarketCoins).not.toContain(
        "ethereum/erc20/usd__coin",
      );
    });

    it("shows Show in portfolio when the asset is blacklisted", async () => {
      mockMarket.withData(MarketMockedResponse.usdcDetail);
      setupRoute("ethereum/erc20/usd__coin", OWNED_ASSETS[1].buildDistribution());

      const { user } = renderWithMockedCounterValuesProvider(<AssetDetail />, {
        initialState: {
          settings: {
            ...AFTER_ONBOARDING_STATE,
            blacklistedTokenIds: ["ethereum/erc20/usd__coin"],
          },
        },
      });

      await waitFor(() => {
        expect(screen.getByTestId(TEST_ID.HEADER_OPTIONS)).toBeVisible();
      });

      await user.click(screen.getByTestId(TEST_ID.HEADER_OPTIONS));

      expect(screen.getByRole("menuitem", { name: /show in portfolio/i })).toBeVisible();
    });

    it("renders the hidden banner when the asset is blacklisted and unhides it from the banner action", async () => {
      mockMarket.withData(MarketMockedResponse.bitcoinDetail);
      setupRoute("bitcoin", OWNED_ASSETS[0].buildDistribution());

      const { user, store } = renderWithMockedCounterValuesProvider(<AssetDetail />, {
        initialState: {
          settings: {
            ...AFTER_ONBOARDING_STATE,
            blacklistedTokenIds: ["bitcoin"],
          },
        },
      });

      await waitFor(() => {
        expect(screen.getByTestId(TEST_ID.HIDDEN_BANNER)).toBeVisible();
      });

      expect(screen.getByText("This asset is hidden from your portfolio.")).toBeVisible();

      await user.click(screen.getByTestId(TEST_ID.HIDDEN_BANNER_SHOW_ASSET));

      await waitFor(() => {
        expect(store.getState().settings.blacklistedTokenIds).not.toContain("bitcoin");
      });

      expect(screen.queryByTestId(TEST_ID.HIDDEN_BANNER)).not.toBeInTheDocument();
    });

    it("does not render the hidden banner when the asset is not blacklisted", async () => {
      mockMarket.withData(MarketMockedResponse.bitcoinDetail);
      setupRoute("bitcoin", OWNED_ASSETS[0].buildDistribution());

      renderWithMockedCounterValuesProvider(<AssetDetail />);

      await waitFor(() => {
        expectHeader();
      });

      expect(screen.queryByTestId(TEST_ID.HIDDEN_BANNER)).not.toBeInTheDocument();
    });

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
      async ({ routeId, ticker, marketResponse, buildDistribution }) => {
        mockMarket.withData(marketResponse);
        mockDada.fail();
        setupRoute(routeId, buildDistribution());

        renderWithMockedCounterValuesProvider(<AssetDetail />);

        await waitFor(() => {
          expectHeader();
          expectAssetTicker(ticker);
          expectOwnedView();
          expectMarketView();
        });
        await waitForMarketPriceSectionShowsQuote();
      },
    );

    it.each(OWNED_ASSETS)(
      "$label - falls back to DADA when Market API fails",
      async ({ routeId, ticker, buildDistribution }) => {
        mockMarket.fail();
        setupRoute(routeId, buildDistribution());

        renderWithMockedCounterValuesProvider(<AssetDetail />);

        await waitFor(() => {
          expectHeader();
          expectAssetTicker(ticker);
          expectOwnedView();
          expect(screen.getByRole("heading", { name: LABEL.MARKET_STATS })).toBeVisible();
        });
      },
    );
  });

  describe("discovery mode (no account)", () => {
    it.each(DISCOVERY_ASSETS)(
      "$label - shows header and market sections without owned view",
      async ({ routeId, ticker, marketResponse }) => {
        mockMarket.withData(marketResponse);
        setupRoute(routeId, { list: [] });

        render(<AssetDetail />);

        await waitFor(() => {
          expectHeader();
          expectAssetTicker(ticker);
          expectMarketView();
        });
        await waitForMarketPriceSectionShowsQuote();
        expectNoOwnedView();
      },
    );

    it("shows the earn banner when the asset is stakeable and not in the portfolio", async () => {
      mockGetCanStakeCurrency.mockReturnValue(true);
      mockMarket.withData(MarketMockedResponse.bitcoinDetail);
      setupRoute("bitcoin", { list: [] });

      render(<AssetDetail />);

      await waitFor(() => {
        expect(screen.getByTestId(TEST_ID.EARN_BANNER)).toBeVisible();
        expect(screen.getByText("Earn with this asset")).toBeVisible();
      });

      expect(screen.queryByTestId(TEST_ID.AVAILABLE_BALANCE)).not.toBeInTheDocument();
      expect(screen.queryByTestId(TEST_ID.EARN_DEPOSIT)).not.toBeInTheDocument();
    });

    it("shows APY in the earn banner in discovery mode when interest rate is available", async () => {
      mockGetCanStakeCurrency.mockReturnValue(true);
      mockUseInterestRatesByCurrencies.mockReturnValue({
        bitcoin: { value: 0.12, type: "APY" },
      });
      mockMarket.withData(MarketMockedResponse.bitcoinDetail);
      setupRoute("bitcoin", { list: [] });

      render(<AssetDetail />);

      await waitFor(() => {
        expect(screen.getByTestId(TEST_ID.EARN_BANNER)).toBeVisible();
        expect(screen.getByText("Earn up to 12.0% APY")).toBeVisible();
      });
    });

    it("hides the staking section in discovery mode when the asset is not stakeable", async () => {
      mockMarket.withData(MarketMockedResponse.bitcoinDetail);
      setupRoute("bitcoin", { list: [] });

      render(<AssetDetail />);

      await waitFor(() => {
        expectHeader();
        expectMarketView();
      });

      expect(screen.queryByTestId(TEST_ID.STAKING_SECTION)).not.toBeInTheDocument();
      expect(screen.queryByTestId(TEST_ID.EARN_BANNER)).not.toBeInTheDocument();
    });

    it.each(DISCOVERY_ASSETS)(
      "$label - falls back to Market API when DADA fails",
      async ({ routeId, ticker, marketResponse }) => {
        mockMarket.withData(marketResponse);
        mockDada.fail();
        setupRoute(routeId, { list: [] });

        render(<AssetDetail />);

        await waitFor(() => {
          expectHeader();
          expectAssetTicker(ticker);
          expectMarketView();
        });
        await waitForMarketPriceSectionShowsQuote();
      },
    );

    it.each(LOCATION_STATE_FALLBACK)(
      "$label - falls back to location state when Market is empty",
      async ({ routeId, ticker, state }) => {
        mockMarket.empty();
        setLocation(state, `/asset/${routeId}`);
        setupRoute(routeId, { list: [] });

        render(<AssetDetail />);

        await waitFor(() => {
          expectHeader();
          expectAssetTicker(ticker);
        });
      },
    );
  });

  describe("loading state", () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it("shows per-section skeletons while waiting for Market response", () => {
      mockMarket.hang();
      setupRoute("unknown-asset", { list: [] });

      render(<AssetDetail />);

      expect(screen.getByTestId(TEST_ID.MARKET_PRICE_SECTION)).toBeVisible();
      expect(screen.getByTestId(TEST_ID.MARKET_DATA_SECTION)).toBeVisible();
      expectActionBarHidden();
      expect(screen.getByTestId("asset-detail-total-balance-skeleton")).toBeVisible();
      expect(screen.getByTestId("asset-detail-address-list-skeleton")).toBeVisible();
      expect(screen.getByTestId("asset-detail-transactions-skeleton")).toBeVisible();
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

    it("does not render not-found while distribution is still loading", () => {
      setupDistributionRouteMocks(useParams, useDistribution, "unknown-asset", {
        list: [],
        isLoading: true,
      });

      render(<AssetDetail />);

      expectActionBarHidden();
      expect(screen.getByTestId("asset-detail-total-balance-skeleton")).toBeVisible();
      expect(screen.queryByText(LABEL.NOT_FOUND)).not.toBeInTheDocument();
    });
  });

  describe("market section and transaction layout", () => {
    it("surfaces market detail fields from the API and lists transaction history after the market grid when the account is in the store", async () => {
      mockDada.empty();
      mockMarket.withData(MarketMockedResponse.bitcoinDetail);
      const account = genAccount("asset-detail-market-tx-layout", { currency: btc });
      const item = buildDistributionItem({ accounts: [account] });
      setupRoute("bitcoin", { bySlug: { bitcoin: item }, list: [item] });

      renderWithMockedCounterValuesProvider(<AssetDetail />, {
        initialState: { accounts: [account], settings: AFTER_ONBOARDING_STATE },
      });

      await waitFor(() => {
        expect(screen.getByText("Market rank")).toBeVisible();
        expect(screen.getByText("#1")).toBeVisible();
        expect(screen.getByText("24h trading volume")).toBeVisible();
      });

      await waitForMarketPriceSectionShowsQuote();

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Transaction history" })).toBeVisible();
      });

      const marketSection = screen.getByTestId(TEST_ID.MARKET_DATA_SECTION);
      const transactionsSection = screen.getByTestId(TEST_ID.TRANSACTIONS_SECTION);
      expect(marketSection.compareDocumentPosition(transactionsSection)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
    });
  });

  describe("action bar states", () => {
    it("enables buy and receive, and disables sell and send when there is no address", async () => {
      mockMarket.withData(MarketMockedResponse.bitcoinDetail);
      setupRoute("bitcoin", { list: [] });

      render(<AssetDetail />);

      await waitFor(() => {
        expectHeader();
        expect(screen.getByTestId(TEST_ID.ACTION_BUY)).toBeEnabled();
      });

      expect(screen.getByTestId(TEST_ID.ACTION_RECEIVE)).toBeEnabled();
      expect(screen.getByTestId(TEST_ID.ACTION_SELL)).toBeDisabled();
      expect(screen.getByTestId(TEST_ID.ACTION_SEND)).toBeDisabled();
    });

    it("keeps sell and send disabled when the address exists but balance is zero", async () => {
      mockMarket.withData(MarketMockedResponse.bitcoinDetail);
      const account = genAccount("asset-detail-zero-balance-account", { currency: btc });
      account.balance = new BigNumber(0);
      account.spendableBalance = new BigNumber(0);
      const item = buildDistributionItem({ accounts: [account] });
      setupRoute("bitcoin", { bySlug: { bitcoin: item }, list: [item] });

      renderWithMockedCounterValuesProvider(<AssetDetail />);

      await waitFor(() => {
        expectHeader();
        expect(screen.getByTestId(TEST_ID.ACTION_BUY)).toBeEnabled();
      });

      expect(screen.getByTestId(TEST_ID.ACTION_RECEIVE)).toBeEnabled();
      expect(screen.getByTestId(TEST_ID.ACTION_SELL)).toBeDisabled();
      expect(screen.getByTestId(TEST_ID.ACTION_SEND)).toBeDisabled();
    });

    it("enables buy, sell and send when the address has a positive spendable balance", async () => {
      mockMarket.withData(MarketMockedResponse.bitcoinDetail);
      const account = genAccount("asset-detail-positive-balance-account", { currency: btc });
      account.balance = new BigNumber(10);
      account.spendableBalance = new BigNumber(10);
      const item = buildDistributionItem({ accounts: [account] });
      setupRoute("bitcoin", { bySlug: { bitcoin: item }, list: [item] });

      renderWithMockedCounterValuesProvider(<AssetDetail />);

      await waitFor(() => {
        expectHeader();
        expect(screen.getByTestId(TEST_ID.ACTION_BUY)).toBeEnabled();
        expect(screen.getByTestId(TEST_ID.ACTION_SELL)).toBeEnabled();
        expect(screen.getByTestId(TEST_ID.ACTION_SEND)).toBeEnabled();
      });

      expect(screen.getByTestId(TEST_ID.ACTION_RECEIVE)).toBeEnabled();
    });

    it("enables buy, sell and send when the address has an earn deposit", async () => {
      mockMarket.withData(MarketMockedResponse.bitcoinDetail);
      const account = genAccount("asset-detail-earn-deposit-account", { currency: btc });
      account.balance = new BigNumber(10);
      account.spendableBalance = new BigNumber(0);
      const item = buildDistributionItem({ accounts: [account] });
      setupRoute("bitcoin", { bySlug: { bitcoin: item }, list: [item] });

      renderWithMockedCounterValuesProvider(<AssetDetail />);

      await waitFor(() => {
        expectHeader();
        expect(screen.getByTestId(TEST_ID.ACTION_BUY)).toBeEnabled();
        expect(screen.getByTestId(TEST_ID.ACTION_SELL)).toBeEnabled();
        expect(screen.getByTestId(TEST_ID.ACTION_SEND)).toBeEnabled();
      });

      expect(screen.getByTestId(TEST_ID.ACTION_RECEIVE)).toBeEnabled();
    });

    it("disables buy and sell when the ramp catalog marks the currency unavailable", async () => {
      mockIsCurrencyAvailable.mockReturnValue(false);
      mockMarket.withData(MarketMockedResponse.bitcoinDetail);
      setupRoute("bitcoin", { list: [] });

      renderWithMockedCounterValuesProvider(<AssetDetail />);

      await waitFor(() => {
        expect(screen.getByTestId(TEST_ID.ACTION_BUY)).toBeDisabled();
      });

      expect(screen.getByTestId(TEST_ID.ACTION_SELL)).toBeDisabled();
      expect(screen.getByTestId(TEST_ID.ACTION_RECEIVE)).toBeEnabled();
    });

    it("disables buy and sell when the currency is not on ramp despite spendable balance", async () => {
      mockIsCurrencyAvailable.mockReturnValue(false);
      mockMarket.withData(MarketMockedResponse.bitcoinDetail);
      const account = genAccount("asset-detail-ramp-off-with-balance-account", { currency: btc });
      account.balance = new BigNumber(10);
      account.spendableBalance = new BigNumber(10);
      const item = buildDistributionItem({ accounts: [account] });
      setupRoute("bitcoin", { bySlug: { bitcoin: item }, list: [item] });

      renderWithMockedCounterValuesProvider(<AssetDetail />);

      await waitFor(() => {
        expectHeader();
        expect(screen.getByTestId(TEST_ID.ACTION_BUY)).toBeDisabled();
        expect(screen.getByTestId(TEST_ID.ACTION_SELL)).toBeDisabled();
        expect(screen.getByTestId(TEST_ID.ACTION_SEND)).toBeEnabled();
      });

      expect(screen.getByTestId(TEST_ID.ACTION_RECEIVE)).toBeEnabled();
    });
  });

  describe("route params", () => {
    it("resolves a token when route id is URL-encoded", async () => {
      mockMarket.withData(MarketMockedResponse.bitcoinDetail);
      const account = genAccount("asset-detail-token-encoded-account", { currency: btc });
      const item = buildDistributionItem({
        currency: makeIntegrationTokenCurrency("bitcoin/test", "TBTC", "Bitcoin Test"),
        accounts: [account],
      });
      setupRoute("bitcoin%2Ftest", { bySlug: {}, list: [item] });

      renderWithMockedCounterValuesProvider(<AssetDetail />);

      await waitFor(() => {
        expectHeader();
        expectAssetTicker("TBTC");
        expect(screen.getByText(LABEL.TOTAL_BALANCE)).toBeVisible();
      });
    });
  });

  describe("PnL section", () => {
    const pnlEnabled = withFlagOverrides({
      lwdWallet40: { enabled: true, params: { pnl: true } },
    });

    const setupBitcoinAsset = (accountId: string) => {
      mockMarket.withData(MarketMockedResponse.bitcoinDetail);
      const account = genAccount(accountId, { currency: btc });
      const item = buildDistributionItem({ accounts: [account] });
      setupRoute("bitcoin", { bySlug: { bitcoin: item }, list: [item] });
      return { account };
    };

    it("does not render the PnL cards when the feature flag is off", async () => {
      const { account } = setupBitcoinAsset("asset-detail-pnl-flag-off");

      renderWithMockedCounterValuesProvider(<AssetDetail />, {
        initialState: { accounts: [account], settings: AFTER_ONBOARDING_STATE },
      });

      await waitFor(() => expectHeader());
      expect(screen.queryByRole("button", { name: /unrealised return/i })).not.toBeInTheDocument();
      expect(screen.queryByText("Average entry price")).not.toBeInTheDocument();
    });

    it("renders both the unrealised return and average entry price cards when the feature flag is on", async () => {
      const { account } = setupBitcoinAsset("asset-detail-pnl-flag-on");

      renderWithMockedCounterValuesProvider(<AssetDetail />, {
        initialState: { ...pnlEnabled, accounts: [account], settings: AFTER_ONBOARDING_STATE },
      });

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /unrealised return/i })).toBeVisible();
        expect(screen.getByText("Average entry price")).toBeVisible();
      });
    });

    it("opens the detail dialog with the three return rows when the unrealised return card is clicked", async () => {
      const { account } = setupBitcoinAsset("asset-detail-pnl-dialog-open");

      const { user } = renderWithMockedCounterValuesProvider(<AssetDetail />, {
        initialState: { ...pnlEnabled, accounts: [account], settings: AFTER_ONBOARDING_STATE },
      });

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      const card = await screen.findByRole("button", { name: /unrealised return/i });
      await user.click(card);

      const dialog = await screen.findByRole("dialog");
      const dialogScope = within(dialog);
      expect(dialogScope.getByText("Total return")).toBeVisible();
      expect(dialogScope.getByText("Unrealised return")).toBeVisible();
      expect(dialogScope.getByText("Realised return")).toBeVisible();
    });

    it("dismisses the detail dialog when the close button is clicked", async () => {
      const { account } = setupBitcoinAsset("asset-detail-pnl-dialog-close");

      const { user } = renderWithMockedCounterValuesProvider(<AssetDetail />, {
        initialState: { ...pnlEnabled, accounts: [account], settings: AFTER_ONBOARDING_STATE },
      });

      const card = await screen.findByRole("button", { name: /unrealised return/i });
      await user.click(card);

      const dialog = await screen.findByRole("dialog");
      await user.click(within(dialog).getByRole("button", { name: /close/i }));

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });
  });

  describe("token route with slashes", () => {
    it("resolves a token with slashes in its route id", async () => {
      mockMarket.withData(MarketMockedResponse.bitcoinDetail);
      const account = genAccount("asset-detail-token-slashed-account", { currency: btc });
      const item = buildDistributionItem({
        currency: makeIntegrationTokenCurrency("bitcoin/test", "TBTC", "Bitcoin Test"),
        accounts: [account],
      });
      setupRoute("bitcoin/test", { bySlug: {}, list: [item] });

      renderWithMockedCounterValuesProvider(<AssetDetail />);

      await waitFor(() => {
        expectHeader();
        expectAssetTicker("TBTC");
        expect(screen.getByText(LABEL.TOTAL_BALANCE)).toBeVisible();
      });
    });
  });
});
