import React from "react";
import { renderWithReactQuery, screen } from "@tests/test-renderer";
import { server, http, HttpResponse, delay } from "@tests/server";
import {
  PortfolioTest,
  ReadOnlyPortfolioTest,
  overrideInitialStateWithReadOnly,
  overrideInitialStateWithPerpsEntryPoint,
  overrideInitialStateWithServicesEntryPoints,
  overrideInitialStateWithAccounts,
  overrideInitialStateWithNoAccounts,
  overrideInitialStateWithOnboardingWidgetVisible,
  overrideInitialStateWithOnboardingWidgetVisibleAndReadOnly,
} from "./shared";

const DADA_API_URLS = [
  "https://dada.api.ledger-test.com/v1/assets",
  "https://dada.api.ledger.com/v1/assets",
];

const setupDadaApiError = () => {
  server.use(
    ...DADA_API_URLS.map(url => http.get(url, () => HttpResponse.json(null, { status: 500 }))),
  );
};

const setupDadaApiLoading = () => {
  server.use(
    ...DADA_API_URLS.map(url =>
      http.get(url, async () => {
        await delay("infinite");
        return HttpResponse.json({});
      }),
    ),
  );
};

function renderedSectionsOrder() {
  return screen
    .getAllByTestId(
      /^(PortfolioCryptosList|portfolio-services-entry-points|PortfolioStablecoinsList)$/,
    )
    .map(function getTestID(node) {
      return node.props.testID;
    });
}

describe("Portfolio Screen", () => {
  it("should render Portfolio", async () => {
    renderWithReactQuery(<PortfolioTest />);

    expect(await screen.findByTestId("PortfolioEmptyList")).toBeVisible();
  });

  describe("Portfolio Balance Section", () => {
    it("should display noFund state when user has no assets", async () => {
      renderWithReactQuery(<PortfolioTest />);

      await screen.findByTestId("PortfolioEmptyList");

      expect(await screen.findByTestId("portfolio-balance-noAccounts")).toBeVisible();
    });

    it("should display noSigner state in readOnly mode", async () => {
      renderWithReactQuery(<ReadOnlyPortfolioTest />, {
        overrideInitialState: overrideInitialStateWithReadOnly,
      });

      await screen.findByTestId("PortfolioReadOnlyItems");

      expect(await screen.findByTestId("portfolio-balance-noSigner")).toBeVisible();
    });
  });

  describe("Perps Entry Point", () => {
    it("should show perps entry point when feature flag is enabled", async () => {
      renderWithReactQuery(<PortfolioTest />, {
        overrideInitialState: overrideInitialStateWithPerpsEntryPoint(true),
      });

      await screen.findByTestId("PortfolioAccountsList");

      expect(await screen.findByTestId("portfolio-perps-entry-point")).toBeVisible();
    });

    it("should hide perps entry point when feature flag is disabled", async () => {
      renderWithReactQuery(<PortfolioTest />, {
        overrideInitialState: overrideInitialStateWithPerpsEntryPoint(false),
      });

      await screen.findByTestId("PortfolioAccountsList");

      expect(screen.queryByTestId("portfolio-perps-entry-point")).toBeNull();
    });
  });

  describe("Services Entry Points", () => {
    it("should display the services between the cryptos and stablecoins sections", async () => {
      renderWithReactQuery(<PortfolioTest />, {
        overrideInitialState: overrideInitialStateWithServicesEntryPoints(),
      });

      await screen.findByTestId("portfolio-services-entry-points");
      await screen.findByTestId("PortfolioStablecoinsList");

      expect(renderedSectionsOrder()).toEqual([
        "PortfolioCryptosList",
        "portfolio-services-entry-points",
        "PortfolioStablecoinsList",
      ]);
    });

    it("should replace the legacy perps and borrow entry points", async () => {
      renderWithReactQuery(<PortfolioTest />, {
        overrideInitialState: overrideInitialStateWithServicesEntryPoints(),
      });

      await screen.findByTestId("portfolio-services-entry-points");

      expect(screen.queryByTestId("portfolio-perps-entry-point")).toBeNull();
      expect(screen.queryByTestId("portfolio-borrow-entry-point")).toBeNull();
    });
  });

  describe("Asset Section", () => {
    it("should display the cryptos list and crypto accounts button when the user has accounts", async () => {
      renderWithReactQuery(<PortfolioTest />, {
        overrideInitialState: overrideInitialStateWithAccounts(),
      });

      await screen.findByTestId("PortfolioAccountsList");

      expect(await screen.findByTestId("PortfolioCryptosList")).toBeVisible();
      expect(await screen.findByTestId("crypto-addresses-button")).toBeVisible();
    });

    it("should display the cryptos list with DADA API assets when there are no accounts", async () => {
      renderWithReactQuery(<PortfolioTest />, {
        overrideInitialState: overrideInitialStateWithNoAccounts,
      });

      await screen.findByTestId("PortfolioEmptyList");

      expect(await screen.findByTestId("PortfolioCryptosList")).toBeVisible();
      expect(await screen.findByTestId("assetItem-Bitcoin")).toBeVisible();
      expect(await screen.findByTestId("assetItem-Ethereum")).toBeVisible();
    });
  });

  describe("Stablecoin Section", () => {
    it("should display the stablecoins list with DADA API assets when there are no accounts", async () => {
      renderWithReactQuery(<PortfolioTest />, {
        overrideInitialState: overrideInitialStateWithNoAccounts,
      });

      await screen.findByTestId("PortfolioEmptyList");

      expect(await screen.findByTestId("PortfolioStablecoinsList")).toBeVisible();
    });
  });

  describe("DADA API States", () => {
    it("should display error states in both cryptos and stablecoins sections when DADA API fails", async () => {
      setupDadaApiError();

      renderWithReactQuery(<PortfolioTest />, {
        overrideInitialState: overrideInitialStateWithNoAccounts,
      });

      await screen.findByTestId("PortfolioEmptyList");

      expect(await screen.findByTestId("PortfolioCryptosList")).toBeVisible();
      expect(await screen.findByTestId("PortfolioStablecoinsList")).toBeVisible();
      const errorStates = await screen.findAllByTestId("assets-error-state");
      expect(errorStates.length).toBeGreaterThanOrEqual(2);
    });

    it("should display skeleton items in both sections while DADA API is loading", async () => {
      setupDadaApiLoading();

      renderWithReactQuery(<PortfolioTest />, {
        overrideInitialState: overrideInitialStateWithNoAccounts,
      });

      await screen.findByTestId("PortfolioEmptyList");

      expect(await screen.findByTestId("PortfolioCryptosList")).toBeVisible();
      expect(await screen.findByTestId("PortfolioStablecoinsList")).toBeVisible();
      expect(screen.getAllByTestId("asset-list-item-skeleton")).toHaveLength(6);
    });
  });

  describe("Portfolio Banners Section", () => {
    it("should display banners section without a page indicator when only one banner is active", async () => {
      renderWithReactQuery(<PortfolioTest />, {
        overrideInitialState: overrideInitialStateWithOnboardingWidgetVisible,
      });

      await screen.findByTestId("PortfolioEmptyList");

      const bannersSections = await screen.findAllByTestId("portfolio-banners-section");
      expect(bannersSections[0]).toBeVisible();
      expect(screen.queryByTestId("banners-page-indicator")).toBeNull();
    });

    it("should display banners section without a page indicator in noSigner state (readOnly mode)", async () => {
      renderWithReactQuery(<ReadOnlyPortfolioTest />, {
        overrideInitialState: overrideInitialStateWithOnboardingWidgetVisibleAndReadOnly,
      });

      await screen.findByTestId("PortfolioReadOnlyItems");

      const bannersSections = await screen.findAllByTestId("portfolio-banners-section");
      expect(bannersSections[0]).toBeVisible();
      expect(screen.queryByTestId("banners-page-indicator")).toBeNull();
    });
  });
});
