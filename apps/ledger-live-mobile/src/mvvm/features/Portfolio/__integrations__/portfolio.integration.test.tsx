import React from "react";
import { renderWithReactQuery, screen } from "@tests/test-renderer";
import { server, http, HttpResponse, delay } from "@tests/server";
import {
  PortfolioTest,
  ReadOnlyPortfolioTest,
  overrideInitialStateWithFeatureFlag,
  overrideInitialStateWithGraphReworkEnabled,
  overrideInitialStateWithGraphReworkAndReadOnly,
  overrideInitialStateWithPerpsEntryPoint,
  overrideInitialStateWithPerpsAndAssetSection,
  overrideInitialStateWithAssetSection,
  overrideInitialStateWithNoAccountsAndAssetSection,
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

describe("Portfolio Screen", () => {
  it("should render Portfolio when feature flag is enabled", async () => {
    renderWithReactQuery(<PortfolioTest />, {
      overrideInitialState: overrideInitialStateWithFeatureFlag,
    });

    expect(await screen.findByTestId("PortfolioEmptyList")).toBeVisible();
  });

  describe("Graph Rework Feature", () => {
    it("should hide graph when graphRework is enabled", async () => {
      renderWithReactQuery(<PortfolioTest />, {
        overrideInitialState: overrideInitialStateWithGraphReworkEnabled,
      });

      await screen.findByTestId("PortfolioEmptyList");

      expect(screen.queryByTestId("graphCard-chart")).toBeNull();
    });

    it("should hide allocation section when graphRework is enabled", async () => {
      renderWithReactQuery(<PortfolioTest />, {
        overrideInitialState: overrideInitialStateWithGraphReworkEnabled,
      });

      await screen.findByTestId("PortfolioEmptyList");

      expect(screen.queryByTestId("portfolio-allocation-section")).toBeNull();
    });
  });

  describe("Portfolio Balance Section", () => {
    it("should display noFund state when graphRework is enabled and user has no assets", async () => {
      renderWithReactQuery(<PortfolioTest />, {
        overrideInitialState: overrideInitialStateWithGraphReworkEnabled,
      });

      await screen.findByTestId("PortfolioEmptyList");

      expect(await screen.findByTestId("portfolio-balance-noAccounts")).toBeVisible();
    });

    it("should display noSigner state when graphRework is enabled and user is in readOnly mode", async () => {
      renderWithReactQuery(<ReadOnlyPortfolioTest />, {
        overrideInitialState: overrideInitialStateWithGraphReworkAndReadOnly,
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

    it("should show perps entry point when assetSection is also enabled", async () => {
      renderWithReactQuery(<PortfolioTest />, {
        overrideInitialState: overrideInitialStateWithPerpsAndAssetSection,
      });

      await screen.findByTestId("PortfolioAccountsList");

      expect(await screen.findByTestId("portfolio-perps-entry-point")).toBeVisible();
    });

    it("should not render perps section wrapper when feature flag is disabled", async () => {
      renderWithReactQuery(<PortfolioTest />, {
        overrideInitialState: overrideInitialStateWithPerpsEntryPoint(false),
      });

      await screen.findByTestId("PortfolioAccountsList");

      expect(screen.queryByTestId("portfolio-perps-entry-point")).toBeNull();
      expect(screen.queryByTestId("portfolio-perps-subheader-row")).toBeNull();
    });
  });

  describe("Asset Section Feature", () => {
    it("should display the cryptos list and crypto accounts button when assetSection is enabled and user has accounts", async () => {
      renderWithReactQuery(<PortfolioTest />, {
        overrideInitialState: overrideInitialStateWithAssetSection(true),
      });

      await screen.findByTestId("PortfolioAccountsList");

      expect(await screen.findByTestId("PortfolioCryptosList")).toBeVisible();
      expect(await screen.findByTestId("crypto-addresses-button")).toBeVisible();
    });

    it("should not display the cryptos list nor the crypto accounts button when assetSection is disabled", async () => {
      renderWithReactQuery(<PortfolioTest />, {
        overrideInitialState: overrideInitialStateWithAssetSection(false),
      });

      await screen.findByTestId("PortfolioAccountsList");

      expect(screen.queryByTestId("PortfolioCryptosList")).toBeNull();
      expect(screen.queryByTestId("crypto-addresses-button")).toBeNull();
    });

    it("should display the fallback read-only cryptos list when user has no accounts and assetSection is disabled", async () => {
      renderWithReactQuery(<PortfolioTest />, {
        overrideInitialState: overrideInitialStateWithNoAccountsAndAssetSection(false),
      });

      await screen.findByTestId("PortfolioEmptyList");

      expect(await screen.findByTestId("PortfolioCryptosList")).toBeVisible();
      expect(screen.queryByTestId("PortfolioStablecoinsList")).toBeNull();
      expect(screen.queryByTestId("crypto-addresses-button")).toBeNull();
    });

    it("should display the cryptos list with DADA API assets when no accounts and assetSection is enabled", async () => {
      renderWithReactQuery(<PortfolioTest />, {
        overrideInitialState: overrideInitialStateWithNoAccountsAndAssetSection(true),
      });

      await screen.findByTestId("PortfolioEmptyList");

      expect(await screen.findByTestId("PortfolioCryptosList")).toBeVisible();
      expect(await screen.findByTestId("assetItem-Bitcoin")).toBeVisible();
      expect(await screen.findByTestId("assetItem-Ethereum")).toBeVisible();
    });

    it("should display the fallback read-only cryptos list when no accounts and assetSection is disabled", async () => {
      renderWithReactQuery(<PortfolioTest />, {
        overrideInitialState: overrideInitialStateWithNoAccountsAndAssetSection(false),
      });

      await screen.findByTestId("PortfolioEmptyList");

      expect(await screen.findByTestId("PortfolioCryptosList")).toBeVisible();
      expect(screen.queryByTestId("PortfolioStablecoinsList")).toBeNull();
      expect(screen.queryByTestId("crypto-addresses-button")).toBeNull();
    });
  });

  describe("Stablecoin Section Feature", () => {
    it("should display the stablecoins list with DADA API assets when no accounts and assetSection is enabled", async () => {
      renderWithReactQuery(<PortfolioTest />, {
        overrideInitialState: overrideInitialStateWithNoAccountsAndAssetSection(true),
      });

      await screen.findByTestId("PortfolioEmptyList");

      expect(await screen.findByTestId("PortfolioStablecoinsList")).toBeVisible();
    });
  });

  describe("DADA API States", () => {
    it("should display error states in both cryptos and stablecoins sections when DADA API fails", async () => {
      setupDadaApiError();

      renderWithReactQuery(<PortfolioTest />, {
        overrideInitialState: overrideInitialStateWithNoAccountsAndAssetSection(true),
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
        overrideInitialState: overrideInitialStateWithNoAccountsAndAssetSection(true),
      });

      await screen.findByTestId("PortfolioEmptyList");

      expect(await screen.findByTestId("PortfolioCryptosList")).toBeVisible();
      expect(await screen.findByTestId("PortfolioStablecoinsList")).toBeVisible();
      expect(screen.getAllByTestId("asset-list-item-skeleton")).toHaveLength(6);
    });
  });

  describe("Portfolio Banners Section", () => {
    it("should display banners section in noFund state", async () => {
      renderWithReactQuery(<PortfolioTest />, {
        overrideInitialState: overrideInitialStateWithGraphReworkEnabled,
      });

      await screen.findByTestId("PortfolioEmptyList");

      const bannersSections = await screen.findAllByTestId("portfolio-banners-section");
      expect(bannersSections[0]).toBeVisible();
    });

    it("should display banners section in noSigner state (readOnly mode)", async () => {
      renderWithReactQuery(<ReadOnlyPortfolioTest />, {
        overrideInitialState: overrideInitialStateWithGraphReworkAndReadOnly,
      });

      await screen.findByTestId("PortfolioReadOnlyItems");

      const bannersSections = await screen.findAllByTestId("portfolio-banners-section");
      expect(bannersSections[0]).toBeVisible();
    });
  });
});
