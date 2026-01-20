import React from "react";
import { renderWithReactQuery, screen } from "@tests/test-renderer";
import { PortfolioTest, ReadOnlyPortfolioTest } from "./shared";

describe("Portfolio MVVM Integration Tests", () => {
  describe("Portfolio Screen", () => {
    it("should render Portfolio when feature flag is enabled", async () => {
      renderWithReactQuery(<PortfolioTest />, {
        overrideInitialState: state => ({
          ...state,
          settings: {
            ...state.settings,
            overriddenFeatureFlags: {
              lwmWallet40: { enabled: true },
            },
          },
        }),
      });

      expect(await screen.findByTestId("PortfolioEmptyList")).toBeVisible();
    });
  });

  describe("ReadOnly Portfolio Screen", () => {
    it("should render ReadOnly Portfolio when feature flag is enabled", async () => {
      renderWithReactQuery(<ReadOnlyPortfolioTest />, {
        overrideInitialState: state => ({
          ...state,
          settings: {
            ...state.settings,
            overriddenFeatureFlags: {
              lwmWallet40: { enabled: true },
            },
          },
        }),
      });

      expect(await screen.findByTestId("PortfolioReadOnlyItems")).toBeVisible();
    });
  });
});
