import React from "react";
import { Linking } from "react-native";
import { render, screen } from "@tests/test-renderer";
import * as analytics from "~/analytics";
import AnalyticsConsentScreen from "../screens/AnalyticsConsentScreen";

jest.mock("LLM/features/NotificationsPrompt", () => ({
  useNotificationsContext: () => ({ notifyFlowCompleted: jest.fn() }),
}));

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: jest.fn() }),
  useRoute: () => ({ params: { entryPoint: "Portfolio" } }),
}));

describe("AnalyticsConsentScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should enable analytics + recommendations and track when Accept all is pressed", async () => {
    const { user, store } = render(<AnalyticsConsentScreen />);

    await user.press(screen.getByRole("button", { name: "Accept all" }));

    expect(store.getState().settings.analyticsEnabled).toBe(true);
    expect(store.getState().settings.personalizedRecommendationsEnabled).toBe(true);
    expect(store.getState().settings.hasSeenAnalyticsOptInPrompt).toBe(true);
    expect(analytics.track).toHaveBeenCalledWith(
      "button_clicked",
      {
        button: "Accept All",
        flow: "consent existing users",
        page: "Analytics Consent",
      },
      true,
    );
    expect(analytics.updateIdentify).toHaveBeenCalledTimes(1);
  });

  it("should disable analytics + recommendations and track when Refuse all is pressed", async () => {
    const { user, store } = render(<AnalyticsConsentScreen />);

    await user.press(screen.getByRole("button", { name: "Refuse all" }));

    expect(store.getState().settings.analyticsEnabled).toBe(false);
    expect(store.getState().settings.personalizedRecommendationsEnabled).toBe(false);
    expect(store.getState().settings.hasSeenAnalyticsOptInPrompt).toBe(true);
    expect(analytics.track).toHaveBeenCalledWith(
      "button_clicked",
      {
        button: "Refuse All",
        flow: "consent existing users",
        page: "Analytics Consent",
      },
      true,
    );
    expect(analytics.updateIdentify).toHaveBeenCalledTimes(1);
  });

  it("should track Set Preferences when the link is pressed", async () => {
    const { user } = render(<AnalyticsConsentScreen />);

    await user.press(screen.getByText("Set preferences"));

    expect(analytics.track).toHaveBeenCalledWith(
      "button_clicked",
      {
        button: "Set Preferences",
        flow: "consent existing users",
        page: "Analytics Consent",
      },
      true,
    );
  });

  it("should open the privacy policy URL and track when Privacy policy is pressed", async () => {
    const openURLSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    const { user } = render(<AnalyticsConsentScreen />);

    await user.press(screen.getByText("Privacy policy"));

    expect(openURLSpy).toHaveBeenCalledWith(expect.stringContaining("privacy-policy"));
    expect(analytics.track).toHaveBeenCalledWith(
      "button_clicked",
      {
        button: "Privacy policy",
        flow: "consent existing users",
      },
      true,
    );

    openURLSpy.mockRestore();
  });
});
