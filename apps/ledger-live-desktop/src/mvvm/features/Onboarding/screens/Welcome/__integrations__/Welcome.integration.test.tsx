import React from "react";
import { MemoryRouter, Route, Routes } from "react-router";
import electron from "electron";
import { render, screen, waitFor, withFlagOverrides } from "tests/testSetup";
import { Welcome } from "../index";
import {
  AFTER_ONBOARDING_STATE,
  INITIAL_STATE,
  hasOnboardedDeviceSelector,
} from "~/renderer/reducers/settings";
import { urls } from "~/config/urls";
import { isAcceptedTerms } from "~/renderer/terms";

function renderWelcome(initialState: NonNullable<Parameters<typeof render>[1]>["initialState"]) {
  return render(
    <MemoryRouter initialEntries={["/onboarding"]}>
      <Routes>
        <Route path="/" element={<h1>Portfolio home</h1>} />
        <Route path="/onboarding" element={<Welcome />} />
        <Route path="/onboarding/select-device" element={<h1>Select device</h1>} />
        <Route path="/settings" element={<h1>Settings</h1>} />
      </Routes>
    </MemoryRouter>,
    {
      skipRouter: true,
      initialState,
    },
  );
}

describe("Welcome", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  describe("redirect when onboarding is already completed", () => {
    it('should navigate to "/" when lazy onboarding and no onboarded device', async () => {
      renderWelcome({
        settings: {
          ...INITIAL_STATE,
          hasCompletedOnboarding: true,
        },
        ...withFlagOverrides({
          lwdWallet40: { enabled: true, params: { lazyOnboarding: true } },
          lwdAnalyticsOptInScreenV2: { enabled: false },
          lldAnalyticsOptInPrompt: { enabled: false },
        }),
      });

      await waitFor(() =>
        expect(screen.getByRole("heading", { name: "Portfolio home" })).toBeVisible(),
      );
    });

    it("should navigate to select-device when lazy onboarding but user has a seen device", async () => {
      renderWelcome({
        settings: {
          ...INITIAL_STATE,
          hasCompletedOnboarding: true,
          lastSeenDevice: AFTER_ONBOARDING_STATE.lastSeenDevice,
        },
        ...withFlagOverrides({
          lwdWallet40: { enabled: true, params: { lazyOnboarding: true } },
          lwdAnalyticsOptInScreenV2: { enabled: false },
          lldAnalyticsOptInPrompt: { enabled: false },
        }),
      });

      await waitFor(() =>
        expect(screen.getByRole("heading", { name: "Select device" })).toBeVisible(),
      );
    });

    it("should navigate to select-device when lazy onboarding is disabled", async () => {
      renderWelcome({
        settings: {
          ...INITIAL_STATE,
          hasCompletedOnboarding: true,
        },
        ...withFlagOverrides({
          lwdWallet40: { enabled: true, params: { lazyOnboarding: false } },
          lwdAnalyticsOptInScreenV2: { enabled: false },
          lldAnalyticsOptInPrompt: { enabled: false },
        }),
      });

      await waitFor(() =>
        expect(screen.getByRole("heading", { name: "Select device" })).toBeVisible(),
      );
    });
  });

  describe("Get started", () => {
    it('should complete onboarding and navigate to "/" when lazy onboarding is enabled', async () => {
      const { user, store } = renderWelcome({
        settings: {
          ...INITIAL_STATE,
          hasSeenAnalyticsOptInPrompt: true,
        },
        ...withFlagOverrides({
          lwdWallet40: { enabled: true, params: { lazyOnboarding: true } },
          lwdAnalyticsOptInScreenV2: { enabled: false },
          lldAnalyticsOptInPrompt: { enabled: false },
        }),
      });

      await user.click(screen.getByTestId("v3-onboarding-get-started-button"));

      expect(isAcceptedTerms()).toBe(true);
      expect(store.getState().settings.hasCompletedOnboarding).toBe(true);
      await waitFor(() =>
        expect(screen.getByRole("heading", { name: "Portfolio home" })).toBeVisible(),
      );
    });

    it("should navigate to select-device when lazy onboarding is disabled", async () => {
      const { user } = renderWelcome({
        settings: {
          ...INITIAL_STATE,
          hasSeenAnalyticsOptInPrompt: true,
        },
        ...withFlagOverrides({
          lwdWallet40: { enabled: true, params: { lazyOnboarding: false } },
          lwdAnalyticsOptInScreenV2: { enabled: false },
          lldAnalyticsOptInPrompt: { enabled: false },
        }),
      });

      await user.click(screen.getByTestId("v3-onboarding-get-started-button"));

      expect(isAcceptedTerms()).toBe(true);
      await waitFor(() =>
        expect(screen.getByRole("heading", { name: "Select device" })).toBeVisible(),
      );
    });

    it("should hide Buy new and Ledger Sync when lazy onboarding is enabled", () => {
      renderWelcome({
        settings: {
          ...INITIAL_STATE,
          hasCompletedOnboarding: false,
          hasSeenAnalyticsOptInPrompt: true,
        },
        ...withFlagOverrides({
          lwdWallet40: { enabled: true, params: { lazyOnboarding: true } },
          lwdAnalyticsOptInScreenV2: { enabled: false },
          lldAnalyticsOptInPrompt: { enabled: false },
        }),
      });

      expect(screen.getByTestId("v3-onboarding-get-started-button")).toBeVisible();
      expect(screen.queryByTestId("onboarding-device-button")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /Sync with another Ledger Wallet app/ }),
      ).not.toBeInTheDocument();
    });
  });

  describe("Buy new", () => {
    it("should open the Reborn URL", async () => {
      const { user } = renderWelcome({
        settings: {
          ...INITIAL_STATE,
          hasSeenAnalyticsOptInPrompt: true,
        },
        ...withFlagOverrides({
          lwdWallet40: { enabled: true, params: { lazyOnboarding: false } },
          lwdAnalyticsOptInScreenV2: { enabled: false },
          lldAnalyticsOptInPrompt: { enabled: false },
        }),
      });

      await user.click(screen.getByTestId("onboarding-device-button"));

      expect(electron.shell.openExternal).toHaveBeenCalledWith(urls.reborn);
    });
  });

  describe("DEV skip onboarding", () => {
    it("should not show the skip button when not in development", () => {
      renderWelcome({
        settings: {
          ...INITIAL_STATE,
          hasSeenAnalyticsOptInPrompt: true,
        },
        ...withFlagOverrides({
          lwdWallet40: { enabled: true, params: { lazyOnboarding: true } },
          lwdAnalyticsOptInScreenV2: { enabled: false },
          lldAnalyticsOptInPrompt: { enabled: false },
        }),
      });

      expect(
        screen.queryByRole("button", { name: "(DEV) skip onboarding" }),
      ).not.toBeInTheDocument();
    });

    describe("when __DEV__", () => {
      beforeAll(() => {
        Object.defineProperty(globalThis, "__DEV__", { value: true, configurable: true });
      });

      afterAll(() => {
        Object.defineProperty(globalThis, "__DEV__", { value: false, configurable: true });
      });

      it("should accept terms, grant analytics consent, mark a device onboarded, complete onboarding and go to settings", async () => {
        const { user, store } = renderWelcome({
          settings: {
            ...INITIAL_STATE,
            hasSeenAnalyticsOptInPrompt: true,
          },
          ...withFlagOverrides({
            lwdWallet40: { enabled: true, params: { lazyOnboarding: true } },
            lwdAnalyticsOptInScreenV2: { enabled: false },
            lldAnalyticsOptInPrompt: { enabled: false },
          }),
        });

        await user.click(screen.getByRole("button", { name: "(DEV) skip onboarding" }));

        expect(isAcceptedTerms()).toBe(true);
        expect(store.getState().settings.shareAnalytics).toBe(true);
        expect(store.getState().settings.sharePersonalizedRecommandations).toBe(true);
        expect(store.getState().settings.analyticsConsentInfo.consentDate).toEqual(
          expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        );
        expect(store.getState().settings.hasSeenAnalyticsOptInPrompt).toBe(true);
        expect(store.getState().settings.hasCompletedOnboarding).toBe(true);
        expect(hasOnboardedDeviceSelector(store.getState())).toBe(true);
        await waitFor(() =>
          expect(screen.getByRole("heading", { name: "Settings" })).toBeVisible(),
        );
      });

      it("should skip onboarding without opening analytics opt-in when the prompt is unseen", async () => {
        const { user, store } = renderWelcome({
          settings: {
            ...INITIAL_STATE,
            hasSeenAnalyticsOptInPrompt: false,
          },
          ...withFlagOverrides({
            lwdWallet40: { enabled: true, params: { lazyOnboarding: true } },
            lwdAnalyticsOptInScreenV2: { enabled: true },
            lldAnalyticsOptInPrompt: {
              enabled: true,
              params: {
                variant: "A",
                entryPoints: ["Onboarding"],
              },
            },
          }),
        });

        await user.click(screen.getByRole("button", { name: "(DEV) skip onboarding" }));

        expect(screen.queryByTestId("analytics-opt-in-screen")).not.toBeInTheDocument();
        expect(screen.queryByTestId("accept-analytics-button")).not.toBeInTheDocument();
        expect(isAcceptedTerms()).toBe(true);
        expect(store.getState().settings.shareAnalytics).toBe(true);
        expect(store.getState().settings.sharePersonalizedRecommandations).toBe(true);
        expect(store.getState().settings.analyticsConsentInfo.consentDate).toEqual(
          expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        );
        expect(store.getState().settings.hasSeenAnalyticsOptInPrompt).toBe(true);
        expect(store.getState().settings.hasCompletedOnboarding).toBe(true);
        expect(hasOnboardedDeviceSelector(store.getState())).toBe(true);
        await waitFor(() =>
          expect(screen.getByRole("heading", { name: "Settings" })).toBeVisible(),
        );
      });
    });
  });
});
