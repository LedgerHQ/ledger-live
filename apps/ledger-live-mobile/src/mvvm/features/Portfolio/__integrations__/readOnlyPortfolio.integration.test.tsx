import React from "react";
import { renderWithReactQuery, screen, withFlagOverrides } from "@tests/test-renderer";
import {
  ReadOnlyPortfolioTest,
  overrideInitialStateWithFeatureFlag,
  overrideInitialStateWithGraphReworkEnabled,
} from "./shared";
import { withConsentDrawerState } from "LLM/features/AnalyticsConsentDrawer/__tests__/helpers";

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

  it("should show the reconfirm consent drawer on Wallet v4 read-only portfolio", async () => {
    renderWithReactQuery(<ReadOnlyPortfolioTest />, {
      overrideInitialState: withFlagOverrides({ lwmWallet40: { enabled: true } }, state =>
        withConsentDrawerState({
          hasCompletedOnboarding: true,
          analyticsOptInEnabled: true,
          analyticsEnabled: true,
          personalizedRecommendationsEnabled: true,
          consentDate: null,
          privacyPolicyVersion: 1,
        })({
          ...state,
          accounts: {
            active: [],
          },
          settings: {
            ...state.settings,
            readOnlyModeEnabled: true,
          },
        }),
      ),
    });

    await screen.findByTestId("PortfolioReadOnlyItems");
    expect(await screen.findByText("Continue improving Ledger?")).toBeVisible();
  });
});
