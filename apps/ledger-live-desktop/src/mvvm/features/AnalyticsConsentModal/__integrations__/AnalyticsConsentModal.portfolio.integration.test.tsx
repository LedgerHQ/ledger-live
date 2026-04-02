import React from "react";
import { Route, Routes } from "react-router";
import { render, screen, waitFor } from "tests/testSetup";
import { FEATURE_FLAGS_INITIAL_STATE } from "@shared/feature-flags";
import { CURRENT_PRIVACY_POLICY_VERSION } from "@ledgerhq/live-common/privacyConsent";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import { AnalyticsConsentModal } from "../index";

const featureFlagsWithAnalyticsOptIn = {
  ...FEATURE_FLAGS_INITIAL_STATE,
  overrides: {
    ...FEATURE_FLAGS_INITIAL_STATE.overrides,
    analyticsOptIn: { enabled: true },
  },
};

function baseSettings(overrides: Record<string, unknown> = {}) {
  return {
    ...INITIAL_STATE,
    hasCompletedOnboarding: true,
    shareAnalytics: false,
    sharePersonalizedRecommandations: false,
    analyticsConsentInfo: {
      consentDate: null,
      privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
    },
    ...overrides,
  };
}

function PortfolioRouteWithModal() {
  return (
    <>
      <div data-testid="portfolio-stub" />
      <AnalyticsConsentModal />
    </>
  );
}

function TestRouter() {
  return (
    <Routes>
      <Route path="/" element={<PortfolioRouteWithModal />} />
      <Route path="/settings/display" element={<div data-testid="settings-display-stub" />} />
    </Routes>
  );
}

describe("AnalyticsConsentModal on portfolio route", () => {
  it("shows fresh consent when renewal is needed and share analytics is off", async () => {
    render(<TestRouter />, {
      initialRoute: "/",
      initialState: {
        featureFlags: featureFlagsWithAnalyticsOptIn,
        settings: baseSettings({
          shareAnalytics: false,
          sharePersonalizedRecommandations: false,
        }),
      },
    });

    expect(
      await screen.findByRole("heading", { name: "Help us improve Ledger" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /close/i })).not.toBeInTheDocument();
  });

  it("shows reconfirm copy when renewal is needed and share analytics is on", async () => {
    render(<TestRouter />, {
      initialRoute: "/",
      initialState: {
        featureFlags: featureFlagsWithAnalyticsOptIn,
        settings: baseSettings({
          shareAnalytics: true,
          sharePersonalizedRecommandations: true,
        }),
      },
    });

    expect(
      await screen.findByRole("heading", { name: "Continue improving Ledger?" }),
    ).toBeInTheDocument();
  });

  it("opts in and closes when Accept all is used (fresh phase)", async () => {
    const { user, store } = render(<TestRouter />, {
      initialRoute: "/",
      initialState: {
        featureFlags: featureFlagsWithAnalyticsOptIn,
        settings: baseSettings({
          shareAnalytics: false,
          sharePersonalizedRecommandations: false,
        }),
      },
    });

    await screen.findByRole("heading", { name: "Help us improve Ledger" });
    await user.click(screen.getByRole("button", { name: /accept all/i }));

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: "Help us improve Ledger" }),
      ).not.toBeInTheDocument();
    });
    expect(store.getState().settings.shareAnalytics).toBe(true);
    expect(store.getState().settings.hasSeenAnalyticsOptInPrompt).toBe(true);
  });

  it("opts out and closes when Refuse all is used (fresh phase)", async () => {
    const { user, store } = render(<TestRouter />, {
      initialRoute: "/",
      initialState: {
        featureFlags: featureFlagsWithAnalyticsOptIn,
        settings: baseSettings({
          shareAnalytics: false,
          sharePersonalizedRecommandations: false,
        }),
      },
    });

    await screen.findByRole("heading", { name: "Help us improve Ledger" });
    await user.click(screen.getByRole("button", { name: /refuse all/i }));

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: "Help us improve Ledger" }),
      ).not.toBeInTheDocument();
    });
    expect(store.getState().settings.shareAnalytics).toBe(false);
    expect(store.getState().settings.hasSeenAnalyticsOptInPrompt).toBe(true);
  });

  it("keeps analytics on when Yes, continue is used (reconfirm)", async () => {
    const { user, store } = render(<TestRouter />, {
      initialRoute: "/",
      initialState: {
        featureFlags: featureFlagsWithAnalyticsOptIn,
        settings: baseSettings({
          shareAnalytics: true,
          sharePersonalizedRecommandations: true,
        }),
      },
    });

    await screen.findByRole("heading", { name: "Continue improving Ledger?" });
    await user.click(screen.getByRole("button", { name: /yes, continue/i }));

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: "Continue improving Ledger?" }),
      ).not.toBeInTheDocument();
    });
    expect(store.getState().settings.shareAnalytics).toBe(true);
    expect(store.getState().settings.hasSeenAnalyticsOptInPrompt).toBe(true);
  });

  it("opts out when No, stop is used (reconfirm)", async () => {
    const { user, store } = render(<TestRouter />, {
      initialRoute: "/",
      initialState: {
        featureFlags: featureFlagsWithAnalyticsOptIn,
        settings: baseSettings({
          shareAnalytics: true,
          sharePersonalizedRecommandations: true,
        }),
      },
    });

    await screen.findByRole("heading", { name: "Continue improving Ledger?" });
    await user.click(screen.getByRole("button", { name: /no, stop/i }));

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: "Continue improving Ledger?" }),
      ).not.toBeInTheDocument();
    });
    expect(store.getState().settings.shareAnalytics).toBe(false);
    expect(store.getState().settings.hasSeenAnalyticsOptInPrompt).toBe(true);
  });

  it("shows privacy update and closes after Got it", async () => {
    const { user, store } = render(<TestRouter />, {
      initialRoute: "/",
      initialState: {
        featureFlags: featureFlagsWithAnalyticsOptIn,
        settings: baseSettings({
          shareAnalytics: true,
          sharePersonalizedRecommandations: true,
          analyticsConsentInfo: {
            consentDate: new Date().toISOString(),
            privacyPolicyVersion: Math.max(0, CURRENT_PRIVACY_POLICY_VERSION - 1),
          },
        }),
      },
    });

    expect(
      await screen.findByRole("heading", { name: "We're updating our privacy policy" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /got it/i }));

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: "We're updating our privacy policy" }),
      ).not.toBeInTheDocument();
    });
    expect(store.getState().settings.analyticsConsentInfo.privacyPolicyVersion).toBe(
      CURRENT_PRIVACY_POLICY_VERSION,
    );
    expect(store.getState().settings.hasSeenAnalyticsOptInPrompt).toBe(true);
  });

  it("navigates to display settings when Set preferences is clicked", async () => {
    const { user } = render(<TestRouter />, {
      initialRoute: "/",
      initialState: {
        featureFlags: featureFlagsWithAnalyticsOptIn,
        settings: baseSettings({
          shareAnalytics: false,
          sharePersonalizedRecommandations: false,
        }),
      },
    });

    await screen.findByRole("heading", { name: "Help us improve Ledger" });
    await user.click(screen.getByRole("button", { name: /set preferences/i }));

    await waitFor(() => {
      expect(screen.getByTestId("settings-display-stub")).toBeInTheDocument();
    });
  });
});
