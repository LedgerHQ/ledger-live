import React from "react";
import { renderWithReactQuery, screen } from "@tests/test-renderer";
import { PortfolioTest, overrideInitialStateWithFeatureFlag } from "./shared";

describe("Portfolio Screen", () => {
  it("should render Portfolio when feature flag is enabled", async () => {
    renderWithReactQuery(<PortfolioTest />, {
      overrideInitialState: overrideInitialStateWithFeatureFlag,
    });

    expect(await screen.findByTestId("PortfolioEmptyList")).toBeVisible();
  });
});
