import React from "react";
import { Linking, Text } from "react-native";
import { render, screen } from "@tests/test-renderer";
import { type NavigatorScreenParams } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NotificationsPromptProvider } from "LLM/features/NotificationsPrompt";
import * as analytics from "~/analytics";
import { NavigatorName, ScreenName } from "~/const";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type {
  AnalyticsOptInPromptNavigatorParamList,
  EntryPoint,
} from "~/components/RootNavigator/types/AnalyticsOptInPromptNavigator";
import AnalyticsConsentScreen from "../screens/AnalyticsConsentScreen";

type TestStackParamList = {
  AnalyticsConsent: { entryPoint: EntryPoint };
  [NavigatorName.AnalyticsOptInPrompt]: NavigatorScreenParams<AnalyticsOptInPromptNavigatorParamList>;
  [NavigatorName.Base]: NavigatorScreenParams<BaseNavigatorStackParamList>;
};

const Stack = createNativeStackNavigator<TestStackParamList>();

function SetPreferencesScreen() {
  return <Text>{ScreenName.AnalyticsOptInPromptDetails}</Text>;
}

function PortfolioScreen() {
  return <Text>Portfolio</Text>;
}

function renderScreen() {
  return render(
    <NotificationsPromptProvider>
      <Stack.Navigator
        initialRouteName="AnalyticsConsent"
        screenOptions={{ headerShown: false, animation: "none" }}
      >
        <Stack.Screen
          name="AnalyticsConsent"
          component={AnalyticsConsentScreen}
          initialParams={{ entryPoint: "Portfolio" }}
        />
        <Stack.Screen name={NavigatorName.AnalyticsOptInPrompt} component={SetPreferencesScreen} />
        <Stack.Screen name={NavigatorName.Base} component={PortfolioScreen} />
      </Stack.Navigator>
    </NotificationsPromptProvider>,
  );
}

describe("AnalyticsConsentScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should enable analytics + recommendations and track when Accept all is pressed", async () => {
    const { user, store } = renderScreen();

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
    const { user, store } = renderScreen();

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
    const { user } = renderScreen();

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
