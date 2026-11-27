import React from "react";
import { track } from "@shared/analytics";
import { LinkingProvider } from "@shared/linking";
import { act, fireEvent, render, screen, withFlagOverrides } from "@tests/test-renderer";
import SettingsNavigator from "~/components/RootNavigator/SettingsNavigator";
import { setAnalytics, setPersonalizedRecommendations, setReportErrors } from "~/actions/settings";
import { updateIdentify } from "~/analytics";
import type { State } from "~/reducers/types";

jest.mock("@react-native-firebase/app", () => ({
  getApp: () => ({ options: { projectId: "ledger-live-staging" } }),
}));

// The jest setup replaces the segment module without updateIdentify, which the consents call.
jest.mock("~/analytics/segment", () => ({
  setAnalyticsFeatureFlagMethod: jest.fn(),
  usePageNameFromRoute: jest.fn(() => "portfolio_navigator"),
  updateIdentify: jest.fn(() => Promise.resolve()),
}));

const BUG_REPORTS_TOGGLE = "setting-bugReports-toggle";
const APP_PERFORMANCE_TOGGLE = "setting-appPerformance-toggle";
const PERSONALIZED_TOGGLE = "setting-personalizedExperience-toggle";

type Consents = Partial<
  Pick<
    State["settings"],
    "reportErrorsEnabled" | "analyticsEnabled" | "personalizedRecommendationsEnabled"
  >
>;

const withConsents = (isNewSettingsEnabled: boolean, consents: Consents = {}) =>
  withFlagOverrides({ newSettings: { enabled: isNewSettingsEnabled } }, (state: State) => ({
    ...state,
    settings: {
      ...state.settings,
      reportErrorsEnabled: true,
      analyticsEnabled: false,
      personalizedRecommendationsEnabled: false,
      ...consents,
    },
  }));

async function openPrivacy(consents?: Consents) {
  const openExternal = jest.fn();
  const rendered = render(
    <LinkingProvider config={{ openExternal }}>
      <SettingsNavigator />
    </LinkingProvider>,
    { overrideInitialState: withConsents(true, consents) },
  );

  await rendered.user.press(await screen.findByTestId("settings-home-privacy"));
  expect(await screen.findByTestId("settings-privacy")).toBeVisible();

  return { ...rendered, openExternal };
}

// The Lumen switch changes value rather than being pressed.
const turn = async (testID: string, value: boolean) => {
  const toggle = await screen.findByTestId(testID);

  await act(async () => {
    fireEvent(toggle, "checkedChange", value);
  });
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Settings Privacy section", () => {
  it("keeps the legacy Settings when the flag is off", async () => {
    render(<SettingsNavigator />, { overrideInitialState: withConsents(false) });

    expect(await screen.findByText("Configure general Ledger Wallet settings.")).toBeVisible();
    expect(screen.queryByTestId("settings-home-privacy")).toBeNull();
  });

  it("shows bug reports, app performance, personalized experience and the privacy policy", async () => {
    await openPrivacy();

    expect(screen.getByText("Bug reports")).toBeVisible();
    expect(screen.getByText("App performance")).toBeVisible();
    expect(screen.getByText("Personalized experience")).toBeVisible();
    expect(screen.getByText("Privacy policy")).toBeVisible();
    expect(screen.queryByTestId("setting-analytics-toggle")).toBeNull();
  });

  it("stores bug reports where the legacy row stores it, without refreshing the identity", async () => {
    const { store } = await openPrivacy();

    await turn(BUG_REPORTS_TOGGLE, false);

    expect(store.getState().settings.reportErrorsEnabled).toBe(false);
    expect(updateIdentify).not.toHaveBeenCalled();
  });

  it("stores app performance, refreshes the identity and tracks the legacy toggle", async () => {
    const { store } = await openPrivacy();

    await turn(APP_PERFORMANCE_TOGGLE, true);

    expect(store.getState().settings.analyticsEnabled).toBe(true);
    expect(store.getState().settings.personalizedRecommendationsEnabled).toBe(false);
    expect(updateIdentify).toHaveBeenCalledWith(undefined, true);
    expect(track).toHaveBeenCalledWith(
      "toggle_clicked",
      { toggle: "Analytics", enabled: true, page: "Page Settings General" },
      { mandatory: true },
    );
  });

  it("stores personalized recommendations, refreshes the identity and tracks the legacy toggle", async () => {
    const { store } = await openPrivacy();

    await turn(PERSONALIZED_TOGGLE, true);

    expect(store.getState().settings.personalizedRecommendationsEnabled).toBe(true);
    expect(store.getState().settings.analyticsEnabled).toBe(false);
    expect(updateIdentify).toHaveBeenCalledWith(undefined, true);
    expect(track).toHaveBeenCalledWith(
      "toggle_clicked",
      { toggle: "Recommendations", enabled: true, page: "Page Settings General" },
      { mandatory: true },
    );
  });

  it("shows a change made elsewhere in the app", async () => {
    const { store } = await openPrivacy();
    expect(screen.getByTestId(BUG_REPORTS_TOGGLE)).toBeChecked();
    expect(screen.getByTestId(APP_PERFORMANCE_TOGGLE)).not.toBeChecked();

    act(() => {
      store.dispatch(setReportErrors(false));
      store.dispatch(setAnalytics(true));
      store.dispatch(setPersonalizedRecommendations(true));
    });

    expect(screen.getByTestId(BUG_REPORTS_TOGGLE)).not.toBeChecked();
    expect(screen.getByTestId(APP_PERFORMANCE_TOGGLE)).toBeChecked();
    expect(screen.getByTestId(PERSONALIZED_TOGGLE)).toBeChecked();
  });

  it("opens the mobile privacy policy and sends the legacy row event", async () => {
    const { user, openExternal } = await openPrivacy();

    await user.press(screen.getByText("Privacy policy"));

    expect(openExternal).toHaveBeenCalledWith(
      expect.stringContaining("shop.ledger.com/pages/privacy-policy"),
    );
    expect(openExternal).toHaveBeenCalledWith(expect.stringContaining("ledger_live_mobile"));
    expect(track).toHaveBeenCalledWith("PrivacyPolicyRow");
  });
});
