import React from "react";
import { Route, Routes } from "react-router";
import { track } from "@shared/analytics";
import { LinkingProvider } from "@shared/linking";
import { SettingsRoute } from "LLD/features/Settings";
import { urls } from "~/config/urls";
import {
  setCrashReporting,
  setShareAnalytics,
  setSharePersonalizedRecommendations,
} from "~/renderer/actions/settings";
import { updateIdentify } from "~/renderer/analytics/segment";
import {
  crashReportingSelector,
  shareAnalyticsSelector,
  sharePersonalizedRecommendationsSelector,
} from "~/renderer/reducers/settings";
import { act, render, screen, withFlagOverrides } from "tests/testSetup";

jest.mock("@shared/analytics", () => ({
  ...jest.requireActual<object>("@shared/analytics"),
  track: jest.fn(),
}));

jest.mock("~/renderer/analytics/segment", () => ({
  ...jest.requireActual<object>("~/renderer/analytics/segment"),
  updateIdentify: jest.fn(() => Promise.resolve()),
}));

type FlagOverrides = Parameters<typeof withFlagOverrides>[0];

function renderPrivacy({
  isNewSettingsEnabled = true,
  areConsentsSeparate = true,
}: { isNewSettingsEnabled?: boolean; areConsentsSeparate?: boolean } = {}) {
  const openExternal = jest.fn();
  const flags: FlagOverrides = {
    newSettings: { enabled: isNewSettingsEnabled },
    lldAnalyticsOptInPrompt: { enabled: areConsentsSeparate },
  };
  const rendered = render(
    <LinkingProvider config={{ openExternal }}>
      <Routes>
        <Route
          path="/settings/*"
          element={<SettingsRoute legacySettings={<span>Legacy settings</span>} />}
        />
      </Routes>
    </LinkingProvider>,
    { initialRoute: "/settings/privacy", initialState: withFlagOverrides(flags) },
  );
  return { ...rendered, openExternal };
}

describe("SettingsRoute, Privacy section", () => {
  beforeEach(() => {
    jest.mocked(track).mockClear();
    jest.mocked(updateIdentify).mockClear();
  });

  it("keeps the legacy Settings on the Privacy address when the flag is off", () => {
    renderPrivacy({ isNewSettingsEnabled: false });

    expect(screen.getByText("Legacy settings")).toBeVisible();
    expect(screen.queryByTestId("settings-privacy")).not.toBeInTheDocument();
  });

  it("shows bug reports, app performance, personalized experience and the privacy policy", () => {
    renderPrivacy();

    expect(screen.getByTestId("settings-privacy")).toBeVisible();
    expect(screen.getByText("Bug reports")).toBeVisible();
    expect(screen.getByText("App performance")).toBeVisible();
    expect(screen.getByText("Personalized experience")).toBeVisible();
    expect(screen.getByText("Privacy policy")).toBeVisible();
    expect(screen.queryByTestId("setting-analytics-toggle")).not.toBeInTheDocument();
  });

  it("changes bug reports in the app store, where the legacy screen reads it", async () => {
    const { user, store } = renderPrivacy();
    expect(screen.getByTestId("setting-bugReports-toggle")).toBeChecked();

    await user.click(screen.getByTestId("setting-bugReports-toggle"));

    expect(crashReportingSelector(store.getState())).toBe(false);
    expect(updateIdentify).not.toHaveBeenCalled();
  });

  it("changes app performance, refreshes the analytics identity and tracks the toggle", async () => {
    const { user, store } = renderPrivacy();

    await user.click(screen.getByTestId("setting-appPerformance-toggle"));

    expect(shareAnalyticsSelector(store.getState())).toBe(true);
    expect(sharePersonalizedRecommendationsSelector(store.getState())).toBe(false);
    expect(updateIdentify).toHaveBeenCalledWith({ force: true });
    expect(track).toHaveBeenCalledWith(
      "toggle_clicked",
      { toggle: "Analytics", enabled: true, page: "settings general" },
      { mandatory: true },
    );
  });

  it("changes personalized recommendations, refreshes the analytics identity and tracks the toggle", async () => {
    const { user, store } = renderPrivacy();

    await user.click(screen.getByTestId("setting-personalizedExperience-toggle"));

    expect(sharePersonalizedRecommendationsSelector(store.getState())).toBe(true);
    expect(shareAnalyticsSelector(store.getState())).toBe(false);
    expect(updateIdentify).toHaveBeenCalledWith({ force: true });
    expect(track).toHaveBeenCalledWith(
      "toggle_clicked",
      { toggle: "personalised recommendations", enabled: true, page: "settings general" },
      { mandatory: true },
    );
  });

  it("shows one Analytics toggle that changes both consents while the opt-in flag is off", async () => {
    const { user, store } = renderPrivacy({ areConsentsSeparate: false });
    expect(screen.queryByText("App performance")).not.toBeInTheDocument();
    expect(screen.queryByText("Personalized experience")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("setting-analytics-toggle"));

    expect(shareAnalyticsSelector(store.getState())).toBe(true);
    expect(sharePersonalizedRecommendationsSelector(store.getState())).toBe(true);
    expect(updateIdentify).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("setting-analytics-toggle")).toBeChecked();
    expect(track).toHaveBeenCalledWith("AnalyticsEnabled", {}, { mandatory: true });
  });

  it("shows a change made elsewhere in the app", () => {
    const { store } = renderPrivacy();

    act(() => {
      store.dispatch(setCrashReporting(false));
      store.dispatch(setShareAnalytics(true));
      store.dispatch(setSharePersonalizedRecommendations(true));
    });

    expect(screen.getByTestId("setting-bugReports-toggle")).not.toBeChecked();
    expect(screen.getByTestId("setting-appPerformance-toggle")).toBeChecked();
    expect(screen.getByTestId("setting-personalizedExperience-toggle")).toBeChecked();
  });

  it("opens the privacy policy of the desktop app", async () => {
    const { user, openExternal } = renderPrivacy();

    await user.click(screen.getByText("Privacy policy"));

    expect(openExternal).toHaveBeenCalledWith(urls.privacyPolicy);
  });
});
