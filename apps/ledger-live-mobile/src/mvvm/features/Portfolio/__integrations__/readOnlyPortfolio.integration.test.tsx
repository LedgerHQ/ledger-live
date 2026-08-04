import React from "react";
import { renderWithReactQuery, screen } from "@tests/test-renderer";
import { ReadOnlyPortfolioTest } from "./shared";
import { withConsentDrawerState } from "LLM/features/AnalyticsConsentDrawer/__tests__/helpers";

describe("ReadOnly Portfolio Screen", () => {
  it("should render ReadOnly Portfolio", async () => {
    renderWithReactQuery(<ReadOnlyPortfolioTest />);

    expect(await screen.findByTestId("PortfolioReadOnlyItems")).toBeVisible();
  });

  it("should show the reconfirm consent drawer on the read-only portfolio", async () => {
    renderWithReactQuery(<ReadOnlyPortfolioTest />, {
      overrideInitialState: state =>
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
    });

    await screen.findByTestId("PortfolioReadOnlyItems");
    expect(await screen.findByText("Continue improving Ledger?")).toBeVisible();
  });
});
