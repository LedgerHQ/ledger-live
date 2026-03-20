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
  overrideInitialStateWithAssetSection,
  overrideInitialStateWithNoAccountsAndAssetSection,
} from "./shared";

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
  });

  describe("Asset Section Feature", () => {
    it("should display the cryptos list when assetSection is enabled and user has accounts", async () => {
      renderWithReactQuery(<PortfolioTest />, {
        overrideInitialState: overrideInitialStateWithAssetSection(true),
      });

      await screen.findByTestId("PortfolioAccountsList");

      expect(await screen.findByTestId("PortfolioCryptosList")).toBeVisible();
    });

    it("should not display the cryptos list when assetSection is disabled", async () => {
      renderWithReactQuery(<PortfolioTest />, {
        overrideInitialState: overrideInitialStateWithAssetSection(false),
      });

      await screen.findByTestId("PortfolioAccountsList");

      expect(screen.queryByTestId("PortfolioCryptosList")).toBeNull();
    });

    it("should not display the cryptos list when user has no accounts and assetSection is disabled", async () => {
      renderWithReactQuery(<PortfolioTest />, {
        overrideInitialState: overrideInitialStateWithFeatureFlag,
      });

      await screen.findByTestId("PortfolioEmptyList");

      expect(screen.queryByTestId("PortfolioCryptosList")).toBeNull();
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

    it("should not display the cryptos list when no accounts and assetSection is disabled", async () => {
      renderWithReactQuery(<PortfolioTest />, {
        overrideInitialState: overrideInitialStateWithNoAccountsAndAssetSection(false),
      });

      await screen.findByTestId("PortfolioEmptyList");

      expect(screen.queryByTestId("PortfolioCryptosList")).toBeNull();
    });

    it("should display error state when DADA API fails", async () => {
      server.use(
        http.get("https://dada.api.ledger-test.com/v1/assets", () =>
          HttpResponse.json(null, { status: 500 }),
        ),
        http.get("https://dada.api.ledger.com/v1/assets", () =>
          HttpResponse.json(null, { status: 500 }),
        ),
      );

      renderWithReactQuery(<PortfolioTest />, {
        overrideInitialState: overrideInitialStateWithNoAccountsAndAssetSection(true),
      });

      await screen.findByTestId("PortfolioEmptyList");

      expect(await screen.findByTestId("PortfolioCryptosList")).toBeVisible();
      expect(await screen.findByTestId("assets-error-state")).toBeVisible();
    });

    it("should display skeleton items while DADA API is loading", async () => {
      server.use(
        http.get("https://dada.api.ledger-test.com/v1/assets", async () => {
          await delay("infinite");
          return HttpResponse.json({});
        }),
        http.get("https://dada.api.ledger.com/v1/assets", async () => {
          await delay("infinite");
          return HttpResponse.json({});
        }),
      );

      renderWithReactQuery(<PortfolioTest />, {
        overrideInitialState: overrideInitialStateWithNoAccountsAndAssetSection(true),
      });

      await screen.findByTestId("PortfolioEmptyList");

      expect(await screen.findByTestId("PortfolioCryptosList")).toBeVisible();
      expect(screen.getAllByTestId("asset-list-item-skeleton")).toHaveLength(4);
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
