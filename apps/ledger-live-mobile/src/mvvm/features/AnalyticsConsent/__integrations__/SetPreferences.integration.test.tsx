import React from "react";
import { Linking } from "react-native";
import { fireEvent, render, screen } from "@tests/test-renderer";
import * as analytics from "~/analytics";
import SetPreferences from "../screens/SetPreferences";

jest.mock("LLM/features/NotificationsPrompt", () => ({
  useNotificationsContext: () => ({ notifyFlowCompleted: jest.fn() }),
}));

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: jest.fn() }),
}));

const routeProp = {
  key: "AnalyticsOptInPromptDetails",
  name: "AnalyticsOptInPromptDetails" as const,
  params: { entryPoint: "Portfolio" as const },
};

function renderScreen() {
  // @ts-expect-error - navigation prop is unused by SetPreferences but required by the type
  return render(<SetPreferences route={routeProp} />);
}

describe("SetPreferences", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render title, both options, and confirm button", () => {
    renderScreen();

    expect(screen.getByText("App performance")).toBeVisible();
    expect(
      screen.getByText("Enable Ledger to collect app usage to enhance the experience"),
    ).toBeVisible();
    expect(screen.getByText("Personalized experience")).toBeVisible();
    expect(
      screen.getByText("Enable Ledger to collect app usage to provide personalized content"),
    ).toBeVisible();
    expect(screen.getByTestId("proceed-button")).toBeVisible();
  });

  it("should persist both toggles enabled when user opts in and confirms", async () => {
    const { user, store } = renderScreen();

    const switches = screen.getAllByRole("switch");
    expect(switches).toHaveLength(2);

    fireEvent(switches[0], "valueChange", true);
    fireEvent(switches[1], "valueChange", true);
    await user.press(screen.getByTestId("proceed-button"));

    expect(store.getState().settings.analyticsEnabled).toBe(true);
    expect(store.getState().settings.personalizedRecommendationsEnabled).toBe(true);
    expect(store.getState().settings.hasSeenAnalyticsOptInPrompt).toBe(true);
    expect(analytics.track).toHaveBeenCalledWith(
      "button_clicked",
      {
        button: "Confirm",
        flow: "consent existing users",
      },
      true,
    );
    expect(analytics.updateIdentify).toHaveBeenCalledTimes(1);
  });

  it("should leave both toggles disabled when user confirms without toggling", async () => {
    const { user, store } = renderScreen();

    await user.press(screen.getByTestId("proceed-button"));

    expect(store.getState().settings.analyticsEnabled).toBe(false);
    expect(store.getState().settings.personalizedRecommendationsEnabled).toBe(false);
    expect(store.getState().settings.hasSeenAnalyticsOptInPrompt).toBe(true);
    expect(analytics.track).toHaveBeenCalledWith(
      "button_clicked",
      {
        button: "Confirm",
        flow: "consent existing users",
      },
      true,
    );
    expect(analytics.updateIdentify).toHaveBeenCalledTimes(1);
  });

  it("should persist only analytics enabled when only the first toggle is on", async () => {
    const { user, store } = renderScreen();

    const switches = screen.getAllByRole("switch");
    fireEvent(switches[0], "valueChange", true);
    await user.press(screen.getByTestId("proceed-button"));

    expect(store.getState().settings.analyticsEnabled).toBe(true);
    expect(store.getState().settings.personalizedRecommendationsEnabled).toBe(false);
    expect(analytics.track).toHaveBeenCalledWith(
      "button_clicked",
      {
        button: "Confirm",
        flow: "consent existing users",
      },
      true,
    );
    expect(analytics.updateIdentify).toHaveBeenCalledTimes(1);
  });

  it("should open the privacy policy URL and track when Privacy policy is pressed", async () => {
    const openURLSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    const { user } = renderScreen();

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
