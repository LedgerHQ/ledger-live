import React from "react";
import { Linking, Text } from "react-native";
import { fireEvent, render, screen } from "@tests/test-renderer";
import { type NavigatorScreenParams } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NotificationsPromptProvider } from "LLM/features/NotificationsPrompt";
import * as analytics from "~/analytics";
import { NavigatorName, ScreenName } from "~/const";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { AnalyticsOptInPromptNavigatorParamList } from "~/components/RootNavigator/types/AnalyticsOptInPromptNavigator";
import SetPreferences from "../screens/SetPreferences";

type TestStackParamList = AnalyticsOptInPromptNavigatorParamList & {
  [NavigatorName.Base]: NavigatorScreenParams<BaseNavigatorStackParamList>;
};

const Stack = createNativeStackNavigator<TestStackParamList>();

function PortfolioScreen() {
  return <Text>Portfolio</Text>;
}

function renderScreen() {
  return render(
    <NotificationsPromptProvider>
      <Stack.Navigator initialRouteName={ScreenName.AnalyticsOptInPromptDetails}>
        <Stack.Screen
          name={ScreenName.AnalyticsOptInPromptDetails}
          component={SetPreferences}
          initialParams={{ entryPoint: "Portfolio" }}
        />
        <Stack.Screen name={NavigatorName.Base} component={PortfolioScreen} />
      </Stack.Navigator>
    </NotificationsPromptProvider>,
  );
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
