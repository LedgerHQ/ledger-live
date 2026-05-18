import React from "react";
import { Route, Routes } from "react-router";
import { render, screen, waitFor } from "tests/testSetup";
import { FEATURE_FLAGS_INITIAL_STATE } from "@shared/feature-flags";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import { track, trackPage, updateIdentify } from "~/renderer/analytics/segment";
import { AnalyticsConsentDialog } from "../index";

const featureFlagsWithAnalyticsOptIn = {
  ...FEATURE_FLAGS_INITIAL_STATE,
  overrides: {
    ...FEATURE_FLAGS_INITIAL_STATE.overrides,
    analyticsOptIn: {
      ...(FEATURE_FLAGS_INITIAL_STATE.overrides.analyticsOptIn ?? {}),
      enabled: true,
    },
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
      privacyPolicyVersion: 1,
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

const ANALYTICS_CONSENT_DIALOG_PAGE = "Analytics consent dialog";
const FRESH_CONSENT_TITLE = "Help us improve Ledger";
const RECONFIRM_TITLE = "Continue improving Ledger?";
const PRIVACY_UPDATE_TITLE = "We're updating our privacy policy";

describe("AnalyticsConsentDialog on portfolio route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("needs fresh consent", () => {
    describe("when analytics and recommendations are disabled", () => {
      it("should opt in when the user accepts", async () => {
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

        const title = await screen.findByRole("heading", { name: FRESH_CONSENT_TITLE });
        expect(title).toBeVisible();
        expect(screen.queryByRole("button", { name: /close/i })).not.toBeInTheDocument();
        expect(trackPage).toHaveBeenCalledWith(
          "AnalyticsConsentDialog",
          "Analytics consent",
          expect.objectContaining({
            phase: "consentFresh",
            type: "modal",
          }),
          true,
          false,
          true,
        );

        await user.click(screen.getByRole("button", { name: "Accept all" }));
        expect(track).toHaveBeenCalledWith(
          "button_clicked",
          {
            button: "analytics_consent_opt_in",
            page: ANALYTICS_CONSENT_DIALOG_PAGE,
            privacyPolicyVersion: 1,
          },
          true,
        );

        await waitFor(() => {
          expect(title).not.toBeInTheDocument();
        });
        expect(store.getState().settings.shareAnalytics).toBe(true);
        expect(store.getState().settings.sharePersonalizedRecommandations).toBe(true);
        expect(store.getState().settings.hasSeenAnalyticsOptInPrompt).toBe(true);
        expect(updateIdentify).toHaveBeenCalledWith({ force: true });
      });

      it("should opt out when the user refuses", async () => {
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

        const title = await screen.findByRole("heading", { name: FRESH_CONSENT_TITLE });
        expect(title).toBeVisible();
        expect(trackPage).toHaveBeenCalledWith(
          "AnalyticsConsentDialog",
          "Analytics consent",
          expect.objectContaining({
            phase: "consentFresh",
            type: "modal",
          }),
          true,
          false,
          true,
        );

        await user.click(screen.getByRole("button", { name: "Refuse all" }));
        expect(track).toHaveBeenCalledWith(
          "button_clicked",
          {
            button: "analytics_consent_opt_out",
            page: ANALYTICS_CONSENT_DIALOG_PAGE,
            privacyPolicyVersion: 1,
          },
          true,
        );

        await waitFor(() => {
          expect(title).not.toBeInTheDocument();
        });
        expect(store.getState().settings.shareAnalytics).toBe(false);
        expect(store.getState().settings.sharePersonalizedRecommandations).toBe(false);
        expect(store.getState().settings.hasSeenAnalyticsOptInPrompt).toBe(true);
        expect(updateIdentify).toHaveBeenCalledWith({ force: true });
      });

      it("should open preferences when the user chooses Set preferences", async () => {
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

        const title = await screen.findByRole("heading", { name: FRESH_CONSENT_TITLE });
        expect(title).toBeVisible();
        expect(trackPage).toHaveBeenCalledWith(
          "AnalyticsConsentDialog",
          "Analytics consent",
          expect.objectContaining({
            phase: "consentFresh",
            type: "modal",
          }),
          true,
          false,
          true,
        );
        const setPreferencesLink = screen.getByRole("link", { name: "Set preferences" });
        expect(setPreferencesLink).toHaveAttribute("href", "#");

        await user.click(setPreferencesLink);
        expect(track).toHaveBeenCalledWith("button_clicked", {
          button: "analytics_consent_set_preferences",
          page: ANALYTICS_CONSENT_DIALOG_PAGE,
        });

        await waitFor(() => {
          expect(screen.getByRole("heading", { name: "Set preferences" })).toBeVisible();
        });
        expect(trackPage).toHaveBeenCalledWith(
          "AnalyticsConsentDialog",
          "Analytics consent",
          expect.objectContaining({
            phase: "preferences",
            type: "modal",
          }),
          true,
          false,
          true,
        );
        expect(screen.getByRole("button", { name: "Confirm" })).toBeVisible();
      });
    });

    describe("when analytics is disabled and recommendations are enabled", () => {
      it("should opt in when the user accepts", async () => {
        const { user, store } = render(<TestRouter />, {
          initialRoute: "/",
          initialState: {
            featureFlags: featureFlagsWithAnalyticsOptIn,
            settings: baseSettings({
              shareAnalytics: false,
              sharePersonalizedRecommandations: true,
            }),
          },
        });

        const title = await screen.findByRole("heading", { name: FRESH_CONSENT_TITLE });
        expect(title).toBeVisible();
        expect(trackPage).toHaveBeenCalledWith(
          "AnalyticsConsentDialog",
          "Analytics consent",
          expect.objectContaining({
            phase: "consentFresh",
            type: "modal",
          }),
          true,
          false,
          true,
        );

        await user.click(screen.getByRole("button", { name: "Accept all" }));
        expect(track).toHaveBeenCalledWith(
          "button_clicked",
          {
            button: "analytics_consent_opt_in",
            page: ANALYTICS_CONSENT_DIALOG_PAGE,
            privacyPolicyVersion: 1,
          },
          true,
        );

        await waitFor(() => {
          expect(title).not.toBeInTheDocument();
        });
        expect(store.getState().settings.shareAnalytics).toBe(true);
        expect(store.getState().settings.sharePersonalizedRecommandations).toBe(true);
        expect(store.getState().settings.hasSeenAnalyticsOptInPrompt).toBe(true);
        expect(updateIdentify).toHaveBeenCalledWith({ force: true });
      });

      it("should opt out when the user refuses", async () => {
        const { user, store } = render(<TestRouter />, {
          initialRoute: "/",
          initialState: {
            featureFlags: featureFlagsWithAnalyticsOptIn,
            settings: baseSettings({
              shareAnalytics: false,
              sharePersonalizedRecommandations: true,
            }),
          },
        });

        const title = await screen.findByRole("heading", { name: FRESH_CONSENT_TITLE });
        expect(title).toBeVisible();
        expect(trackPage).toHaveBeenCalledWith(
          "AnalyticsConsentDialog",
          "Analytics consent",
          expect.objectContaining({
            phase: "consentFresh",
            type: "modal",
          }),
          true,
          false,
          true,
        );

        await user.click(screen.getByRole("button", { name: "Refuse all" }));
        expect(track).toHaveBeenCalledWith(
          "button_clicked",
          {
            button: "analytics_consent_opt_out",
            page: ANALYTICS_CONSENT_DIALOG_PAGE,
            privacyPolicyVersion: 1,
          },
          true,
        );

        await waitFor(() => {
          expect(title).not.toBeInTheDocument();
        });
        expect(store.getState().settings.shareAnalytics).toBe(false);
        expect(store.getState().settings.sharePersonalizedRecommandations).toBe(false);
        expect(store.getState().settings.hasSeenAnalyticsOptInPrompt).toBe(true);
        expect(updateIdentify).toHaveBeenCalledWith({ force: true });
      });

      it("should open preferences when the user chooses Set preferences", async () => {
        const { user } = render(<TestRouter />, {
          initialRoute: "/",
          initialState: {
            featureFlags: featureFlagsWithAnalyticsOptIn,
            settings: baseSettings({
              shareAnalytics: false,
              sharePersonalizedRecommandations: true,
            }),
          },
        });

        const title = await screen.findByRole("heading", { name: FRESH_CONSENT_TITLE });
        expect(title).toBeVisible();
        expect(trackPage).toHaveBeenCalledWith(
          "AnalyticsConsentDialog",
          "Analytics consent",
          expect.objectContaining({
            phase: "consentFresh",
            type: "modal",
          }),
          true,
          false,
          true,
        );
        const setPreferencesLink = screen.getByRole("link", { name: "Set preferences" });
        expect(setPreferencesLink).toHaveAttribute("href", "#");

        await user.click(setPreferencesLink);
        expect(track).toHaveBeenCalledWith("button_clicked", {
          button: "analytics_consent_set_preferences",
          page: ANALYTICS_CONSENT_DIALOG_PAGE,
        });

        await waitFor(() => {
          expect(screen.getByRole("heading", { name: "Set preferences" })).toBeVisible();
        });
        expect(trackPage).toHaveBeenCalledWith(
          "AnalyticsConsentDialog",
          "Analytics consent",
          expect.objectContaining({
            phase: "preferences",
            type: "modal",
          }),
          true,
          false,
          true,
        );
        expect(screen.getByRole("button", { name: "Confirm" })).toBeVisible();
      });
    });
  });

  describe("needs reconfirmation", () => {
    describe("when analytics is enabled and recommendations are disabled", () => {
      it("should keep analytics enabled when the user accepts", async () => {
        const { user, store } = render(<TestRouter />, {
          initialRoute: "/",
          initialState: {
            featureFlags: featureFlagsWithAnalyticsOptIn,
            settings: baseSettings({
              shareAnalytics: true,
              sharePersonalizedRecommandations: false,
            }),
          },
        });

        const title = await screen.findByRole("heading", { name: RECONFIRM_TITLE });
        expect(title).toBeVisible();
        expect(trackPage).toHaveBeenCalledWith(
          "AnalyticsConsentDialog",
          "Analytics consent",
          expect.objectContaining({
            phase: "consentReconfirm",
            type: "modal",
          }),
          true,
          false,
          true,
        );

        await user.click(screen.getByRole("button", { name: "Yes, continue" }));
        expect(track).toHaveBeenCalledWith(
          "button_clicked",
          {
            button: "analytics_consent_opt_in",
            page: ANALYTICS_CONSENT_DIALOG_PAGE,
            privacyPolicyVersion: 1,
          },
          true,
        );

        await waitFor(() => {
          expect(title).not.toBeInTheDocument();
        });
        expect(store.getState().settings.shareAnalytics).toBe(true);
        expect(store.getState().settings.sharePersonalizedRecommandations).toBe(true);
        expect(store.getState().settings.hasSeenAnalyticsOptInPrompt).toBe(true);
        expect(updateIdentify).toHaveBeenCalledWith({ force: true });
      });

      it("should opt out when the user refuses", async () => {
        const { user, store } = render(<TestRouter />, {
          initialRoute: "/",
          initialState: {
            featureFlags: featureFlagsWithAnalyticsOptIn,
            settings: baseSettings({
              shareAnalytics: true,
              sharePersonalizedRecommandations: false,
            }),
          },
        });

        const title = await screen.findByRole("heading", { name: RECONFIRM_TITLE });
        expect(title).toBeVisible();
        expect(trackPage).toHaveBeenCalledWith(
          "AnalyticsConsentDialog",
          "Analytics consent",
          expect.objectContaining({
            phase: "consentReconfirm",
            type: "modal",
          }),
          true,
          false,
          true,
        );

        await user.click(screen.getByRole("button", { name: "No, stop" }));
        expect(track).toHaveBeenCalledWith(
          "button_clicked",
          {
            button: "analytics_consent_opt_out",
            page: ANALYTICS_CONSENT_DIALOG_PAGE,
            privacyPolicyVersion: 1,
          },
          true,
        );

        await waitFor(() => {
          expect(title).not.toBeInTheDocument();
        });
        expect(store.getState().settings.shareAnalytics).toBe(false);
        expect(store.getState().settings.sharePersonalizedRecommandations).toBe(false);
        expect(store.getState().settings.hasSeenAnalyticsOptInPrompt).toBe(true);
        expect(updateIdentify).toHaveBeenCalledWith({ force: true });
      });

      it("should open preferences when the user chooses Set preferences", async () => {
        const { user } = render(<TestRouter />, {
          initialRoute: "/",
          initialState: {
            featureFlags: featureFlagsWithAnalyticsOptIn,
            settings: baseSettings({
              shareAnalytics: true,
              sharePersonalizedRecommandations: false,
            }),
          },
        });

        const title = await screen.findByRole("heading", { name: RECONFIRM_TITLE });
        expect(title).toBeVisible();
        expect(trackPage).toHaveBeenCalledWith(
          "AnalyticsConsentDialog",
          "Analytics consent",
          expect.objectContaining({
            phase: "consentReconfirm",
            type: "modal",
          }),
          true,
          false,
          true,
        );
        const setPreferencesLink = screen.getByRole("link", { name: "Set preferences" });
        expect(setPreferencesLink).toHaveAttribute("href", "#");

        await user.click(setPreferencesLink);
        expect(track).toHaveBeenCalledWith("button_clicked", {
          button: "analytics_consent_set_preferences",
          page: ANALYTICS_CONSENT_DIALOG_PAGE,
        });

        await waitFor(() => {
          expect(screen.getByRole("heading", { name: "Set preferences" })).toBeVisible();
        });
        expect(trackPage).toHaveBeenCalledWith(
          "AnalyticsConsentDialog",
          "Analytics consent",
          expect.objectContaining({
            phase: "preferences",
            type: "modal",
          }),
          true,
          false,
          true,
        );
        expect(screen.getByRole("button", { name: "Confirm" })).toBeVisible();
      });
    });

    describe("when analytics and recommendations are enabled", () => {
      it("should keep analytics enabled when the user accepts", async () => {
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

        const title = await screen.findByRole("heading", { name: RECONFIRM_TITLE });
        expect(title).toBeVisible();
        expect(trackPage).toHaveBeenCalledWith(
          "AnalyticsConsentDialog",
          "Analytics consent",
          expect.objectContaining({
            phase: "consentReconfirm",
            type: "modal",
          }),
          true,
          false,
          true,
        );

        await user.click(screen.getByRole("button", { name: "Yes, continue" }));
        expect(track).toHaveBeenCalledWith(
          "button_clicked",
          {
            button: "analytics_consent_opt_in",
            page: ANALYTICS_CONSENT_DIALOG_PAGE,
            privacyPolicyVersion: 1,
          },
          true,
        );

        await waitFor(() => {
          expect(title).not.toBeInTheDocument();
        });
        expect(store.getState().settings.shareAnalytics).toBe(true);
        expect(store.getState().settings.sharePersonalizedRecommandations).toBe(true);
        expect(store.getState().settings.hasSeenAnalyticsOptInPrompt).toBe(true);
        expect(updateIdentify).toHaveBeenCalledWith({ force: true });
      });

      it("should opt out when the user refuses", async () => {
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

        const title = await screen.findByRole("heading", { name: RECONFIRM_TITLE });
        expect(title).toBeVisible();
        expect(trackPage).toHaveBeenCalledWith(
          "AnalyticsConsentDialog",
          "Analytics consent",
          expect.objectContaining({
            phase: "consentReconfirm",
            type: "modal",
          }),
          true,
          false,
          true,
        );

        await user.click(screen.getByRole("button", { name: "No, stop" }));
        expect(track).toHaveBeenCalledWith(
          "button_clicked",
          {
            button: "analytics_consent_opt_out",
            page: ANALYTICS_CONSENT_DIALOG_PAGE,
            privacyPolicyVersion: 1,
          },
          true,
        );

        await waitFor(() => {
          expect(title).not.toBeInTheDocument();
        });
        expect(store.getState().settings.shareAnalytics).toBe(false);
        expect(store.getState().settings.sharePersonalizedRecommandations).toBe(false);
        expect(store.getState().settings.hasSeenAnalyticsOptInPrompt).toBe(true);
        expect(updateIdentify).toHaveBeenCalledWith({ force: true });
      });

      it("should open preferences when the user chooses Set preferences", async () => {
        const { user } = render(<TestRouter />, {
          initialRoute: "/",
          initialState: {
            featureFlags: featureFlagsWithAnalyticsOptIn,
            settings: baseSettings({
              shareAnalytics: true,
              sharePersonalizedRecommandations: true,
            }),
          },
        });

        const title = await screen.findByRole("heading", { name: RECONFIRM_TITLE });
        expect(title).toBeVisible();
        expect(trackPage).toHaveBeenCalledWith(
          "AnalyticsConsentDialog",
          "Analytics consent",
          expect.objectContaining({
            phase: "consentReconfirm",
            type: "modal",
          }),
          true,
          false,
          true,
        );
        const setPreferencesLink = screen.getByRole("link", { name: "Set preferences" });
        expect(setPreferencesLink).toHaveAttribute("href", "#");

        await user.click(setPreferencesLink);
        expect(track).toHaveBeenCalledWith("button_clicked", {
          button: "analytics_consent_set_preferences",
          page: ANALYTICS_CONSENT_DIALOG_PAGE,
        });

        await waitFor(() => {
          expect(screen.getByRole("heading", { name: "Set preferences" })).toBeVisible();
        });
        expect(trackPage).toHaveBeenCalledWith(
          "AnalyticsConsentDialog",
          "Analytics consent",
          expect.objectContaining({
            phase: "preferences",
            type: "modal",
          }),
          true,
          false,
          true,
        );
        expect(screen.getByRole("button", { name: "Confirm" })).toBeVisible();
      });
    });
  });

  describe("needs privacy policy version update", () => {
    it("should show the privacy update sheet, persist the policy version, and close after Got it", async () => {
      const { user, store } = render(<TestRouter />, {
        initialRoute: "/",
        initialState: {
          featureFlags: featureFlagsWithAnalyticsOptIn,
          settings: baseSettings({
            shareAnalytics: true,
            sharePersonalizedRecommandations: true,
            analyticsConsentInfo: {
              consentDate: new Date().toISOString(),
              privacyPolicyVersion: 0,
            },
          }),
        },
      });

      const title = await screen.findByRole("heading", { name: PRIVACY_UPDATE_TITLE });
      expect(title).toBeVisible();
      expect(trackPage).toHaveBeenCalledWith(
        "AnalyticsConsentDialog",
        "Analytics consent",
        expect.objectContaining({
          phase: "privacy",
          type: "modal",
        }),
        true,
        false,
        true,
      );

      await user.click(screen.getByRole("button", { name: "Got it" }));
      expect(track).toHaveBeenCalledWith(
        "button_clicked",
        {
          button: "analytics_consent_privacy_got_it",
          page: ANALYTICS_CONSENT_DIALOG_PAGE,
          privacyPolicyVersion: 1,
        },
        true,
      );

      await waitFor(() => {
        expect(title).not.toBeInTheDocument();
      });
      expect(store.getState().settings.analyticsConsentInfo.privacyPolicyVersion).toBe(1);
      expect(store.getState().settings.hasSeenAnalyticsOptInPrompt).toBe(true);
      expect(updateIdentify).toHaveBeenCalledWith({ force: true });
    });
  });
});
