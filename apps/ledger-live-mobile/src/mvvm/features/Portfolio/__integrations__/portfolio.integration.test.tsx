import React from "react";
import { renderWithReactQuery, screen } from "@tests/test-renderer";
import {
  PortfolioTest,
  ReadOnlyPortfolioTest,
  overrideInitialStateWithFeatureFlag,
  overrideInitialStateWithGraphReworkEnabled,
  overrideInitialStateWithGraphReworkAndReadOnly,
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
});
