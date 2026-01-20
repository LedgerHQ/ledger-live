import React from "react";
import { renderWithReactQuery, screen } from "@tests/test-renderer";
import { ReadOnlyPortfolioTest, overrideInitialStateWithFeatureFlag } from "./shared";

describe("ReadOnly Portfolio Screen", () => {
  it("should render ReadOnly Portfolio when feature flag is enabled", async () => {
    renderWithReactQuery(<ReadOnlyPortfolioTest />, {
      overrideInitialState: overrideInitialStateWithFeatureFlag,
    });

    expect(await screen.findByTestId("PortfolioReadOnlyItems")).toBeVisible();
  });
});
