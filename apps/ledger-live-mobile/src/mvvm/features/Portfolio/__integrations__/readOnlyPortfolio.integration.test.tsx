import React from "react";
import { resetLazyOnboardingBannerSession } from "@features/flow-lazy-onboarding-banner/testing";
import { renderWithReactQuery, screen, withFlagOverrides } from "@tests/test-renderer";
import storage from "LLM/storage";
import {
  overrideInitialStateWithNoAccounts,
  overrideInitialStateWithReadOnly,
  PortfolioRootTest,
  ReadOnlyPortfolioTest,
} from "./shared";
import { withConsentDrawerState } from "LLM/features/AnalyticsConsentDrawer/__tests__/helpers";

describe("ReadOnly Portfolio Screen", () => {
  beforeEach(() => {
    resetLazyOnboardingBannerSession();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

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

  it("should show the lazy onboarding banner to an eligible no-device user", async () => {
    renderWithReactQuery(<ReadOnlyPortfolioTest />, {
      overrideInitialState: withFlagOverrides(
        {
          lazyOnboardingBanner: {
            enabled: true,
            params: { mode: "shop_direct", link: "https://shop.ledger.com/" },
          },
        },
        state => ({
          ...state,
          settings: {
            ...state.settings,
            hasCompletedOnboarding: true,
            readOnlyModeEnabled: true,
            onboardingHasDevice: false,
            isReborn: true,
            seenDevices: [],
            lastConnectedDevice: null,
          },
        }),
      ),
    });

    expect(await screen.findByText("Why millions choose Ledger?")).toBeVisible();
  });

  it("should run the storage migration when a read-only user with no accounts opens the portfolio", async () => {
    const handleMigration = jest.spyOn(storage, "handleMigration");

    renderWithReactQuery(<PortfolioRootTest />, {
      overrideInitialState: state =>
        overrideInitialStateWithNoAccounts(overrideInitialStateWithReadOnly(state)),
    });

    expect(await screen.findByTestId("PortfolioReadOnlyItems")).toBeVisible();
    expect(handleMigration).toHaveBeenCalledTimes(1);
  });
});
