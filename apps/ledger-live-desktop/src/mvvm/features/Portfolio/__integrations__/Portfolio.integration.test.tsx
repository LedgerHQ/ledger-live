import React from "react";
import { render, screen, waitFor, withFlagOverrides } from "tests/testSetup";
import { server, http, HttpResponse } from "tests/server";
import { MarketMockedResponse } from "tests/handlers/fixtures/market";
import i18next from "i18next";
import PortfolioPage from "../index";
import type { Portfolio as PortfolioType } from "@ledgerhq/types-live";
import { PortfolioView } from "../PortfolioView";
import * as portfolioReact from "@ledgerhq/live-countervalues-react/portfolio";
import * as countervaluesReact from "@ledgerhq/live-countervalues-react";
import { useNavigate } from "react-router";
import { BTC_ACCOUNT, EMPTY_BTC_ACCOUNT } from "../../__mocks__/accounts.mock";
import { createMockCategorizedAssets } from "@ledgerhq/asset-aggregation/mocks/categorizedAssets.mock";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import { track } from "~/renderer/analytics/segment";
import { PORTFOLIO_TRACKING_PAGE_NAME } from "LLD/utils/constants";
import { mockStocksResponse } from "@ledgerhq/live-common/dada-client/mocks/stocks.mock";

const MARKET_API_ENDPOINT = "https://countervalues.live.ledger.com/v3/markets";
const DADA_API_ENDPOINT = "https://dada.api.ledger-test.com/v1/assets";

const mockNavigate = jest.fn();

jest.mock("~/renderer/analytics/segment", () => ({
  ...jest.requireActual("~/renderer/analytics/segment"),
  track: jest.fn(),
}));

// Prevent loading ESM-only @braze/web-sdk (pulled in by dynamic content hooks if imported)
jest.mock("@braze/web-sdk", () => ({
  getCachedContentCards: jest.fn(() => ({ cards: [] })),
  logCardDismissal: jest.fn(),
  logContentCardClick: jest.fn(),
}));

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(() => mockNavigate),
}));

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => {
  type AccountLike = { balance: { isZero: () => boolean } };
  return {
    useAccountBridge: jest.fn(),
    useAccountBridgeOrNull: jest.fn(),
    useAccountBridgeMany: jest.fn((accounts: AccountLike[]) =>
      accounts.map(() => ({
        isAccountEmpty: (a: AccountLike) => a.balance.isZero(),
      })),
    ),
  };
});

const mockedUseNavigate = jest.mocked(useNavigate);

jest.mock("~/renderer/screens/dashboard/components/SwapWebViewEmbedded", () => ({
  __esModule: true,
  default: () => <div data-testid="swap-webview-embedded">SwapWebViewEmbedded</div>,
}));

jest.mock("~/renderer/screens/dashboard/components/Banners/BannerSection", () => ({
  __esModule: true,
  default: () => <div data-testid="banner-section">BannerSection</div>,
}));

jest.mock("~/renderer/screens/dashboard/components/Banners/PortfolioBannerContent", () => ({
  PortfolioBannerContent: () => (
    <div data-testid="portfolio-banner-content">PortfolioBannerContent</div>
  ),
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

// Spies are created per-test in `beforeEach` so the global `restoreMocks: true`
// from jest config can restore them between tests cleanly.
let mockUsePortfolioThrottled: jest.SpyInstance<
  ReturnType<typeof portfolioReact.usePortfolioThrottled>,
  Parameters<typeof portfolioReact.usePortfolioThrottled>
>;
let mockUseCountervaluesPolling: jest.SpyInstance<
  ReturnType<typeof countervaluesReact.useCountervaluesPolling>,
  Parameters<typeof countervaluesReact.useCountervaluesPolling>
>;

const defaultPollingMock = {
  pending: false,
  error: null,
  poll: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  wipe: jest.fn(),
};

const mockUseCategorizedAssetsFromPortfolio = jest.fn();

jest.mock("LLD/hooks/useCategorizedAssets", () => ({
  useCategorizedAssetsFromPortfolio: (...args: unknown[]) =>
    mockUseCategorizedAssetsFromPortfolio(...args),
}));

const defaultCategorizedAssetsMock = () => ({
  categorizedAssets: createMockCategorizedAssets({ stocks: [] }),
  isLoadingStablecoinTickers: false,
  stablecoinTickers: new Set<string>(),
  isLoadingStocks: false,
  isStocksError: false,
});

jest.mock("~/renderer/hooks/usePrice", () => {
  const { getFiatCurrencyByTicker } = jest.requireActual("@ledgerhq/live-common/currencies/index");
  const usd = getFiatCurrencyByTicker("USD");
  return {
    usePrice: () => ({
      counterValue: null,
      counterValueCurrency: usd,
    }),
  };
});

jest.mock("@ledgerhq/live-countervalues-react", () => ({
  ...jest.requireActual("@ledgerhq/live-countervalues-react"),
  useCalculate: () => undefined,
}));

const createPortfolioMock = (countervalueChange: {
  percentage: number | null;
  value: number;
}): PortfolioType => ({
  balanceHistory: [{ date: new Date(), value: 100000 }],
  balanceAvailable: true,
  availableAccounts: [],
  unavailableCurrencies: [],
  accounts: [],
  range: "day",
  histories: [],
  countervalueReceiveSum: 0,
  countervalueSendSum: 0,
  countervalueChange,
});

const defaultPortfolioMock = createPortfolioMock({ percentage: 0.0542, value: 5000 });

describe("PortfolioView", () => {
  const defaultProps = {
    isWallet40Enabled: true,
    totalAccounts: 5,
    totalOperations: 10,
    totalCurrencies: 3,
    hasExchangeBannerCTA: true,
    shouldDisplayMarketBanner: true,
    shouldDisplayGraphRework: true,
    shouldDisplayQuickActionCtas: true,
    shouldDisplayAssetSection: true,
    shouldDisplayAssetDiscoverability: false,
    shouldDisplayOperationsList: true,
    shouldDisplayBorrowSection: false,
    shouldDisplayBrazePlacement: false,
    isClearCacheBannerVisible: false,
    filterOperations: () => true,
    accounts: [],
    t: i18next.t,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePortfolioThrottled = jest.spyOn(portfolioReact, "usePortfolioThrottled");
    mockUseCountervaluesPolling = jest.spyOn(countervaluesReact, "useCountervaluesPolling");
    mockUsePortfolioThrottled.mockReturnValue(defaultPortfolioMock);
    mockUseCountervaluesPolling.mockReturnValue(defaultPollingMock);
    mockedUseNavigate.mockReturnValue(mockNavigate);
    mockUseCategorizedAssetsFromPortfolio.mockReturnValue(defaultCategorizedAssetsMock());
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it("should render BannerSection and portfolio container", () => {
    render(<PortfolioView {...defaultProps} />);
    expect(screen.getByTestId("banner-section")).toBeVisible();
    expect(screen.getByTestId("portfolio-container")).toBeVisible();
  });

  describe("Balance", () => {
    it("should render Balance with total balance when shouldDisplayGraphRework is true", () => {
      render(<PortfolioView {...defaultProps} shouldDisplayGraphRework={true} />, {
        initialState: {
          accounts: [BTC_ACCOUNT],
          settings: AFTER_ONBOARDING_STATE,
        },
      });

      expect(screen.getByTestId("portfolio-balance")).toBeVisible();
      expect(screen.getByTestId("portfolio-total-balance")).toBeVisible();
    });

    it("should not render Balance when shouldDisplayGraphRework is false", () => {
      render(<PortfolioView {...defaultProps} shouldDisplayGraphRework={false} />);
      expect(screen.queryByTestId("portfolio-balance")).toBeNull();
    });

    it("should navigate to analytics when clicking on balance", async () => {
      const { user } = render(<PortfolioView {...defaultProps} shouldDisplayGraphRework />, {
        initialState: {
          accounts: [BTC_ACCOUNT],
          settings: AFTER_ONBOARDING_STATE,
        },
      });

      await user.click(screen.getByTestId("portfolio-balance"));

      expect(mockNavigate).toHaveBeenCalledWith("/analytics");
    });

    it("should render NoBalanceView when user has no accounts", () => {
      render(<PortfolioView {...defaultProps} shouldDisplayGraphRework={true} />, {
        initialState: {
          accounts: [],
          settings: AFTER_ONBOARDING_STATE,
        },
      });

      expect(screen.getByTestId("no-balance-title")).toBeVisible();
      expect(screen.queryByTestId("portfolio-balance")).toBeNull();
    });

    it("should render BalanceView when user has accounts but no funds", () => {
      render(<PortfolioView {...defaultProps} shouldDisplayGraphRework={true} />, {
        initialState: {
          accounts: [EMPTY_BTC_ACCOUNT],
          settings: AFTER_ONBOARDING_STATE,
        },
      });

      expect(screen.queryByTestId("portfolio-balance")).toBeVisible();
    });

    it("should render NoDeviceView when no device has been onboarded", () => {
      render(<PortfolioView {...defaultProps} shouldDisplayGraphRework={true} />, {
        initialState: {
          accounts: [],
          settings: {
            ...AFTER_ONBOARDING_STATE,
            lastSeenDevice: null,
          },
        },
      });

      expect(screen.getByTestId("no-device-title")).toBeVisible();
      expect(screen.queryByTestId("portfolio-balance")).toBeNull();
      expect(screen.queryByTestId("no-balance-title")).toBeNull();
    });

    it("should render NoDeviceView when user completed lazy onboarding without a device", () => {
      render(<PortfolioView {...defaultProps} shouldDisplayGraphRework={true} />, {
        initialState: {
          accounts: [],
          settings: {
            ...AFTER_ONBOARDING_STATE,
            lastSeenDevice: null,
          },
        },
      });

      expect(screen.getByTestId("no-device-title")).toBeVisible();
      expect(screen.queryByTestId("portfolio-balance")).toBeNull();
    });
    it("should display discreet placeholders when discreet mode is enabled", () => {
      render(<PortfolioView {...defaultProps} shouldDisplayGraphRework={true} />, {
        initialState: {
          accounts: [BTC_ACCOUNT],
          settings: {
            ...AFTER_ONBOARDING_STATE,
            discreetMode: true,
          },
        },
      });

      const balanceElement = screen.getByTestId("portfolio-total-balance");
      expect(balanceElement).toHaveTextContent("••••");
      expect(balanceElement).not.toHaveTextContent("$1,000.00");
    });

    it("should render Balance with total balance and show actual amount when discreet mode is disabled", () => {
      render(<PortfolioView {...defaultProps} shouldDisplayGraphRework={true} />, {
        initialState: {
          accounts: [BTC_ACCOUNT],
          settings: {
            ...AFTER_ONBOARDING_STATE,
            discreetMode: false,
          },
        },
      });

      expect(screen.getByTestId("portfolio-balance")).toBeVisible();
      const balanceElement = screen.getByTestId("portfolio-total-balance");
      // TODO: Update once lumen releases a fix for the DisplayAmount animation
      // See LIVE-26796
      expect(balanceElement).toHaveAttribute("aria-label", "$ 1,000.00");
      expect(balanceElement).not.toHaveTextContent("••••"); // Ensure no placeholders
    });

    it("should display loading state when countervalues are being polled", () => {
      mockUseCountervaluesPolling.mockReturnValue({
        ...defaultPollingMock,
        pending: true,
      });

      render(<PortfolioView {...defaultProps} shouldDisplayGraphRework={true} />, {
        initialState: {
          accounts: [BTC_ACCOUNT],
          settings: {
            ...AFTER_ONBOARDING_STATE,
          },
          ...withFlagOverrides({
            lwdWallet40: {
              enabled: true,
              params: { balanceRefreshRework: true },
            },
          }),
        },
      });

      expect(screen.getByTestId("portfolio-balance")).toBeVisible();
    });

    it("should display placeholder when balance is not yet available", () => {
      mockUsePortfolioThrottled.mockReturnValue({
        ...defaultPortfolioMock,
        balanceAvailable: false,
        balanceHistory: [],
      });

      render(<PortfolioView {...defaultProps} shouldDisplayGraphRework={true} />, {
        initialState: {
          accounts: [BTC_ACCOUNT],
          settings: {
            ...AFTER_ONBOARDING_STATE,
          },
          ...withFlagOverrides({
            lwdWallet40: {
              enabled: true,
              params: { balanceRefreshRework: true },
            },
          }),
        },
      });

      expect(screen.getByTestId("portfolio-balance")).toBeVisible();
      expect(screen.getByTestId("portfolio-placeholder-balance")).toBeVisible();
      expect(screen.queryByTestId("portfolio-trend")).toBeNull();
    });
  });

  describe("Trend", () => {
    it("should render Trend with positive percentage and display separator with Today label", () => {
      mockUsePortfolioThrottled.mockReturnValue(
        createPortfolioMock({ percentage: 0.0542, value: 5000 }),
      );

      render(<PortfolioView {...defaultProps} shouldDisplayGraphRework />, {
        initialState: {
          accounts: [BTC_ACCOUNT],
          settings: AFTER_ONBOARDING_STATE,
        },
      });

      expect(screen.getByTestId("portfolio-trend")).toBeVisible();
      expect(screen.getByText("+5.42%")).toBeVisible();
      expect(screen.getByText(/today/i)).toBeVisible();
    });

    it("should render Trend with negative percentage", () => {
      mockUsePortfolioThrottled.mockReturnValue(
        createPortfolioMock({ percentage: -0.0315, value: -3000 }),
      );

      render(<PortfolioView {...defaultProps} shouldDisplayGraphRework />, {
        initialState: {
          accounts: [BTC_ACCOUNT],
          settings: AFTER_ONBOARDING_STATE,
        },
      });

      expect(screen.getByTestId("portfolio-trend")).toBeVisible();
      expect(screen.getByText("-3.15%")).toBeVisible();
    });

    it("should show 0% when percentage is zero", () => {
      mockUsePortfolioThrottled.mockReturnValue(createPortfolioMock({ percentage: 0, value: 0 }));

      render(<PortfolioView {...defaultProps} shouldDisplayGraphRework />, {
        initialState: {
          accounts: [BTC_ACCOUNT],
          settings: AFTER_ONBOARDING_STATE,
        },
      });

      expect(screen.getByTestId("portfolio-trend")).toBeVisible();
      expect(screen.getByTestId("portfolio-trend-percentage")).toBeVisible();
      expect(screen.getByText("0.00%")).toBeVisible();
      expect(screen.getByText(/today/i)).toBeVisible();
    });

    it("should not render Trend when shouldDisplayGraphRework is false", () => {
      render(<PortfolioView {...defaultProps} shouldDisplayGraphRework={false} />);

      expect(screen.queryByTestId("portfolio-trend")).toBeNull();
    });
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

      expect(screen.getByText("Market")).toBeVisible();
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
      expect(screen.queryByText("Market")).toBeNull();
    });
  });

  describe("QuickActions", () => {
    it("should render QuickActions when shouldDisplayQuickActionCtas is true", () => {
      render(<PortfolioView {...defaultProps} shouldDisplayQuickActionCtas={true} />);
      expect(screen.getByTestId("quick-actions-actions-list")).toBeVisible();
    });

    it("should not render QuickActions when shouldDisplayQuickActionCtas is false", () => {
      render(<PortfolioView {...defaultProps} shouldDisplayQuickActionCtas={false} />);
      expect(screen.queryByTestId("quick-actions-actions-list")).toBeNull();
    });
  });

  describe("Perps Entry Point", () => {
    it("should show perps entry point when feature flag is enabled", () => {
      render(<PortfolioView {...defaultProps} />, {
        initialState: {
          settings: {
            ...AFTER_ONBOARDING_STATE,
          },
          ...withFlagOverrides({
            ptxPerpsLiveApp: {
              enabled: true,
            },
          }),
        },
      });

      expect(screen.getByTestId("portfolio-perps-entry-point")).toBeVisible();
    });

    it("should hide perps entry point when feature flag is disabled", () => {
      render(<PortfolioView {...defaultProps} />, {
        initialState: {
          settings: {
            ...AFTER_ONBOARDING_STATE,
          },
          ...withFlagOverrides({
            ptxPerpsLiveApp: {
              enabled: false,
            },
          }),
        },
      });

      expect(screen.queryByTestId("portfolio-perps-entry-point")).toBeNull();
    });

    it("should track and navigate when clicking perps entry point", async () => {
      const { user } = render(<PortfolioView {...defaultProps} />, {
        initialState: {
          settings: {
            ...AFTER_ONBOARDING_STATE,
          },
          ...withFlagOverrides({
            ptxPerpsLiveApp: {
              enabled: true,
            },
          }),
        },
      });

      await user.click(screen.getByTestId("portfolio-perps-subheader-row"));

      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "perps_entry_point",
        flow: "perps",
        page: PORTFOLIO_TRACKING_PAGE_NAME,
      });
      expect(mockNavigate).toHaveBeenCalledWith("/perps");
    });
  });

  it("should not render legacy dashboard components (FeaturedButtons, BalanceSummary)", () => {
    render(<PortfolioView {...defaultProps} />);
    expect(screen.queryByTestId("featured-buttons")).toBeNull();
    expect(screen.queryByTestId("balance-summary")).toBeNull();
  });

  describe("AssetSection", () => {
    it("should render Assets section when shouldDisplayAssetSection is true", async () => {
      render(<PortfolioView {...defaultProps} shouldDisplayAssetSection={true} />);

      await waitFor(() => {
        expect(screen.getByText("Bitcoin")).toBeVisible();
      });

      expect(screen.queryByText("Crypto")).toBeVisible();
      expect(screen.queryByText("Stablecoins")).toBeVisible();
    });

    it("should render AssetDistribution when shouldDisplayAssetSection is false", () => {
      render(<PortfolioView {...defaultProps} shouldDisplayAssetSection={false} />);

      expect(screen.queryByText("Crypto")).not.toBeInTheDocument();
    });
  });

  describe("AddAccount CTA", () => {
    it("should render AddAccount CTA when user has zero accounts, Wallet 4.0 is enabled, and asset section is not displayed", () => {
      render(
        <PortfolioView
          {...defaultProps}
          totalAccounts={0}
          isWallet40Enabled={true}
          shouldDisplayAssetSection={false}
        />,
      );

      expect(screen.getByTestId("portfolio-add-account-button")).toBeVisible();
    });

    it("should not render AddAccount CTA when user has accounts", () => {
      render(<PortfolioView {...defaultProps} totalAccounts={3} isWallet40Enabled={true} />);

      expect(screen.queryByTestId("portfolio-add-account-button")).toBeNull();
    });

    it("should not render AddAccount CTA when Wallet 4.0 is disabled", () => {
      render(
        <PortfolioView
          {...defaultProps}
          totalAccounts={0}
          isWallet40Enabled={false}
          shouldDisplayAssetSection={false}
        />,
      );

      expect(screen.queryByTestId("portfolio-add-account-button")).toBeNull();
    });

    it("should not render AddAccount CTA when asset section is displayed", () => {
      render(
        <PortfolioView
          {...defaultProps}
          totalAccounts={0}
          isWallet40Enabled={true}
          shouldDisplayAssetSection={true}
        />,
      );

      expect(screen.queryByTestId("portfolio-add-account-button")).toBeNull();
    });
  });

  describe("CryptoAddressesBanner", () => {
    it("should render crypto-addresses-banner when asset section is displayed", async () => {
      render(<PortfolioView {...defaultProps} shouldDisplayAssetSection={true} />);

      await waitFor(() => {
        expect(screen.getByTestId("crypto-addresses-banner")).toBeVisible();
      });
    });

    it("should not render crypto-addresses-banner when asset section is not displayed", () => {
      render(<PortfolioView {...defaultProps} shouldDisplayAssetSection={false} />);

      expect(screen.queryByTestId("crypto-addresses-banner")).toBeNull();
    });
  });

  describe("AssetDiscoverability", () => {
    it("should render Stocks discovery section when shouldDisplayAssetDiscoverability is true and user holds no stocks", async () => {
      server.use(http.get(DADA_API_ENDPOINT, () => HttpResponse.json(mockStocksResponse)));

      render(<PortfolioView {...defaultProps} shouldDisplayAssetDiscoverability={true} />);

      await waitFor(() => {
        expect(screen.getByTestId("stock-item-ticker-aaplx")).toBeVisible();
      });

      expect(screen.getByTestId("stocks-section")).toBeVisible();
      expect(screen.getByTestId("stocks-explore")).toBeVisible();
    });

    it("should render owned stocks as an asset table when user holds stocks", async () => {
      const aaplx = mockStocksResponse.cryptoOrTokenCurrencies["solana/spl/applex"];
      mockUseCategorizedAssetsFromPortfolio.mockReturnValue({
        ...defaultCategorizedAssetsMock(),
        categorizedAssets: createMockCategorizedAssets({
          stocks: [
            {
              currency: aaplx,
              balance: 100_000_000,
              value: 226.4,
              distribution: 0.5,
              accounts: [],
            },
          ],
        }),
      });

      render(<PortfolioView {...defaultProps} shouldDisplayAssetDiscoverability={true} />);

      await waitFor(() => {
        expect(screen.getByTestId("w40-asset-row-apple-xstock-solanasplapplex")).toBeVisible();
      });

      expect(screen.getByTestId("stocks-section")).toBeVisible();
      expect(screen.queryByTestId("stocks-explore")).toBeNull();
    });

    it("should not render Stocks section when shouldDisplayAssetDiscoverability is false", () => {
      render(<PortfolioView {...defaultProps} shouldDisplayAssetDiscoverability={false} />);

      expect(screen.queryByTestId("stocks-section")).toBeNull();
    });
  });
});

const walletV4TourFlagOverrides = withFlagOverrides({
  lwdWallet40: {
    enabled: true,
    params: { tour: true, mainNavigation: true, marketBanner: true },
  },
});

describe("Portfolio (Wallet V4 Tour)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePortfolioThrottled = jest.spyOn(portfolioReact, "usePortfolioThrottled");
    mockUseCountervaluesPolling = jest.spyOn(countervaluesReact, "useCountervaluesPolling");
    mockUsePortfolioThrottled.mockReturnValue(defaultPortfolioMock);
    mockUseCountervaluesPolling.mockReturnValue(defaultPollingMock);
    mockUseCategorizedAssetsFromPortfolio.mockReturnValue(defaultCategorizedAssetsMock());
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it("shows Wallet V4 Tour dialog when tour enabled and not seen", async () => {
    const { user } = render(<PortfolioPage />, {
      initialState: {
        settings: {
          ...AFTER_ONBOARDING_STATE,
          hasSeenWalletV4Tour: false,
        },
        ...walletV4TourFlagOverrides,
      },
    });

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
    expect(track).toHaveBeenCalledWith("product_tour_card", {
      page: "Product Tour WV4",
      card: 1,
    });

    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(track).toHaveBeenCalledWith("product_tour_card", {
      page: "Product Tour WV4",
      card: 2,
    });

    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(track).toHaveBeenCalledWith("product_tour_card", {
      page: "Product Tour WV4",
      card: 3,
    });
  });

  it("does not show Wallet V4 Tour when already seen", () => {
    render(<PortfolioPage />, {
      initialState: {
        settings: {
          ...AFTER_ONBOARDING_STATE,
          hasSeenWalletV4Tour: true,
        },
        ...walletV4TourFlagOverrides,
      },
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
