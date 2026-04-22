import React from "react";
import { Route, Routes } from "react-router";
import { render, screen, waitFor, within } from "tests/testSetup";
import { FEATURE_FLAGS_INITIAL_STATE } from "@shared/feature-flags";
import { CURRENT_PRIVACY_POLICY_VERSION } from "@ledgerhq/live-common/privacyConsent";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import { AnalyticsConsentDialog } from "../index";

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

function PortfolioRouteWithDialog() {
  return (
    <>
      <div data-testid="portfolio-stub" />
      <AnalyticsConsentDialog />
    </>
  );
}

function TestRouter() {
  return (
    <Routes>
      <Route path="/" element={<PortfolioRouteWithDialog />} />
      <Route path="/settings/display" element={<div data-testid="settings-display-stub" />} />
    </Routes>
  );
}

describe("AnalyticsConsentDialog on portfolio route", () => {
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

    const freshTitle = await screen.findByRole("heading", { name: "Help us improve Ledger" });
    await user.click(screen.getByRole("button", { name: /accept all/i }));

    await waitFor(() => {
      expect(freshTitle).not.toBeInTheDocument();
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

    const freshTitle = await screen.findByRole("heading", { name: "Help us improve Ledger" });
    await user.click(screen.getByRole("button", { name: /refuse all/i }));

    await waitFor(() => {
      expect(freshTitle).not.toBeInTheDocument();
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

    const reconfirmTitle = await screen.findByRole("heading", {
      name: "Continue improving Ledger?",
    });
    await user.click(screen.getByRole("button", { name: /yes, continue/i }));

    await waitFor(() => {
      expect(reconfirmTitle).not.toBeInTheDocument();
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

    const reconfirmTitle = await screen.findByRole("heading", {
      name: "Continue improving Ledger?",
    });
    await user.click(screen.getByRole("button", { name: /no, stop/i }));

    await waitFor(() => {
      expect(reconfirmTitle).not.toBeInTheDocument();
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

    const privacyTitle = await screen.findByRole("heading", {
      name: "We're updating our privacy policy",
    });
    await user.click(screen.getByRole("button", { name: /got it/i }));

    await waitFor(() => {
      expect(privacyTitle).not.toBeInTheDocument();
    });
    expect(store.getState().settings.analyticsConsentInfo.privacyPolicyVersion).toBe(
      CURRENT_PRIVACY_POLICY_VERSION,
    );
    expect(store.getState().settings.hasSeenAnalyticsOptInPrompt).toBe(true);
  });

  it("shows preferences step when Set preferences is clicked", async () => {
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
    const setPreferencesLink = screen.getByRole("link", { name: /set preferences/i });

    // make sure the link is a11y compliant and does not navigate to a new page
    expect(setPreferencesLink).toHaveAttribute("href", "#");
    
    await user.click(setPreferencesLink);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Set preferences" })).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
  });

  it.each([
    {
      label: "both toggles on",
      expectShareAnalytics: true,
      expectSharePersonalized: true,
    },
    {
      label: "only App performance on",
      expectShareAnalytics: true,
      expectSharePersonalized: false,
    },
    {
      label: "only Personalized experience on",
      expectShareAnalytics: false,
      expectSharePersonalized: true,
    },
    {
      label: "all toggles off",
      expectShareAnalytics: false,
      expectSharePersonalized: false,
    },
  ])(
    "Set preferences: Confirm closes the modal and sets shareAnalytics and sharePersonalizedRecommandations ($label)",
    async ({ expectShareAnalytics, expectSharePersonalized }) => {
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
      await user.click(screen.getByRole("link", { name: /set preferences/i }));
      const modal = await screen.findByTestId("analytics-consent-dialog");
      await screen.findByRole("heading", { name: "Set preferences" });

      // Set preferences opens with both switches OFF (`onSetPreferences` seeds drafts to false).
      const switches = within(modal).getAllByRole("switch");
      expect(switches).toHaveLength(2);
      const [appPerformanceSwitch, personalizedSwitch] = switches;
      if (expectShareAnalytics) {
        await user.click(appPerformanceSwitch);
      }
      if (expectSharePersonalized) {
        await user.click(personalizedSwitch);
      }

      await user.click(screen.getByRole("button", { name: "Confirm" }));

      await waitFor(() => {
        expect(modal).not.toBeInTheDocument();
      });
      const { settings: s } = store.getState();
      expect(s.shareAnalytics).toBe(expectShareAnalytics);
      expect(s.sharePersonalizedRecommandations).toBe(expectSharePersonalized);
      expect(s.hasSeenAnalyticsOptInPrompt).toBe(true);
      expect(s.analyticsConsentInfo.consentDate).not.toBeNull();
    },
  );
});
