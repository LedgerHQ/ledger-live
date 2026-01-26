import React from "react";
import { renderWithReactQuery, screen } from "@tests/test-renderer";
import {
  ReadOnlyPortfolioTest,
  overrideInitialStateWithFeatureFlag,
  overrideInitialStateWithGraphReworkEnabled,
} from "./shared";

describe("ReadOnly Portfolio Screen", () => {
  it("should render ReadOnly Portfolio when feature flag is enabled", async () => {
    renderWithReactQuery(<ReadOnlyPortfolioTest />, {
      overrideInitialState: overrideInitialStateWithFeatureFlag,
    });

    expect(await screen.findByTestId("PortfolioReadOnlyItems")).toBeVisible();
  });

  describe("Graph Rework Feature", () => {
    it("should hide graph when graphRework is enabled", async () => {
      renderWithReactQuery(<ReadOnlyPortfolioTest />, {
        overrideInitialState: overrideInitialStateWithGraphReworkEnabled,
      });

      await screen.findByTestId("PortfolioReadOnlyItems");

      expect(screen.queryByTestId("graphCard-chart")).toBeNull();
    });
  });
});
