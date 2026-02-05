import React from "react";
import { renderWithReactQuery, screen } from "@tests/test-renderer";
import {
  PortfolioTest,
  ReadOnlyPortfolioTest,
  overrideInitialStateWithFeatureFlag,
  overrideInitialStateWithGraphReworkEnabled,
  overrideInitialStateWithGraphReworkAndReadOnly,
  overrideInitialStateWithPerpsEntryPointDisabled,
  overrideInitialStateWithPerpsEntryPointEnabled,
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

      expect(await screen.findByTestId("portfolio-balance-noFund")).toBeVisible();
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
        overrideInitialState: overrideInitialStateWithPerpsEntryPointEnabled,
      });

      await screen.findByTestId("PortfolioAccountsList");

      expect(await screen.findByTestId("portfolio-perps-entry-point")).toBeVisible();
    });

    it("should hide perps entry point when feature flag is disabled", async () => {
      renderWithReactQuery(<PortfolioTest />, {
        overrideInitialState: overrideInitialStateWithPerpsEntryPointDisabled,
      });

      await screen.findByTestId("PortfolioAccountsList");

      expect(screen.queryByTestId("portfolio-perps-entry-point")).toBeNull();
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
