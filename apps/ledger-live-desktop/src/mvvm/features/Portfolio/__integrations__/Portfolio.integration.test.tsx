import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import { server, http, HttpResponse } from "tests/server";
import { MarketMockedResponse } from "tests/handlers/fixtures/market";
import { TFunction } from "i18next";
import { PortfolioView } from "../PortfolioView";

const MARKET_API_ENDPOINT = "https://countervalues.live.ledger.com/v3/markets";

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(() => jest.fn()),
}));

jest.mock("~/renderer/screens/dashboard/components/SwapWebViewEmbedded", () => ({
  __esModule: true,
  default: () => <div data-testid="swap-webview-embedded">SwapWebViewEmbedded</div>,
}));

jest.mock("~/renderer/screens/dashboard/components/BannerSection", () => ({
  __esModule: true,
  default: () => <div data-testid="banner-section">BannerSection</div>,
}));

// Mock RampCatalog provider - returns all currencies as available
jest.mock("@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog", () => ({
  useRampCatalog: () => ({
    isCurrencyAvailable: () => true,
  }),
}));

// Mock swap currencies hook
jest.mock("@ledgerhq/live-common/exchange/swap/hooks/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/exchange/swap/hooks/index"),
  useFetchCurrencyAll: () => ({
    data: ["bitcoin", "ethereum", "solana"],
    isLoading: false,
    error: null,
  }),
}));

describe("PortfolioView", () => {
  const defaultProps = {
    totalAccounts: 5,
    totalOperations: 10,
    totalCurrencies: 3,
    hasExchangeBannerCTA: true,
    shouldDisplayMarketBanner: true,
    shouldDisplaySwapWebView: true,
    filterOperations: () => true,
    accounts: [],
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    t: jest.fn((key: string) => key) as unknown as TFunction,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it("should render BannerSection", () => {
    render(<PortfolioView {...defaultProps} />);
    expect(screen.getByTestId("banner-section")).toBeVisible();
  });

  it("should render portfolio container", () => {
    render(<PortfolioView {...defaultProps} />);
    expect(screen.getByTestId("portfolio-container")).toBeVisible();
  });

  it("should render SwapWebViewEmbedded when shouldDisplaySwapWebView is true", () => {
    render(<PortfolioView {...defaultProps} shouldDisplaySwapWebView={true} />);
    expect(screen.getByTestId("swap-webview-embedded")).toBeVisible();
  });

  it("should not render SwapWebViewEmbedded when shouldDisplaySwapWebView is false", () => {
    render(<PortfolioView {...defaultProps} shouldDisplaySwapWebView={false} />);
    expect(screen.queryByTestId("swap-webview-embedded")).toBeNull();
  });

  describe("MarketBanner", () => {
    it("should render MarketBanner with trending assets when API returns data", async () => {
      server.use(
        http.get(MARKET_API_ENDPOINT, () => {
          return HttpResponse.json(MarketMockedResponse.marketList);
        }),
      );

      render(<PortfolioView {...defaultProps} shouldDisplayMarketBanner={true} />);

      await waitFor(() => {
        expect(screen.getByTestId("trending-assets-list")).toBeVisible();
      });

      expect(screen.getByText("Explore market")).toBeVisible();
    });

    it("should render MarketBanner skeleton while loading", () => {
      server.use(
        http.get(MARKET_API_ENDPOINT, async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return HttpResponse.json(MarketMockedResponse.marketList);
        }),
      );

      render(<PortfolioView {...defaultProps} shouldDisplayMarketBanner={true} />);

      expect(screen.getByTestId("skeleton-list")).toBeVisible();
    });

    it("should render MarketBanner error state when API fails", async () => {
      server.use(
        http.get(MARKET_API_ENDPOINT, () => {
          return HttpResponse.error();
        }),
      );

      render(<PortfolioView {...defaultProps} shouldDisplayMarketBanner={true} />);

      await waitFor(() => {
        expect(screen.getByTestId("generic-error")).toBeVisible();
      });
    });

    it("should not render MarketBanner when shouldDisplayMarketBanner is false", () => {
      render(<PortfolioView {...defaultProps} shouldDisplayMarketBanner={false} />);
      expect(screen.queryByText("Explore market")).toBeNull();
    });
  });

  it("should not render FeaturedButtons", () => {
    render(<PortfolioView {...defaultProps} />);
    expect(screen.queryByTestId("featured-buttons")).toBeNull();
  });

  it("should not render BalanceSummary", () => {
    render(<PortfolioView {...defaultProps} />);
    expect(screen.queryByTestId("balance-summary")).toBeNull();
  });
});
