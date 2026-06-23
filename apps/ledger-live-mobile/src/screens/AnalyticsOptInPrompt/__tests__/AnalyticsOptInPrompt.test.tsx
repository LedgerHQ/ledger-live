import React from "react";
import { Pressable, Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { render, screen, waitFor, withFlagOverrides } from "@tests/test-renderer";
import { NotificationsPromptProvider } from "LLM/features/NotificationsPrompt";
import AnalyticsOptInPromptMain from "~/screens/AnalyticsOptInPrompt/variantA/Main";
import { NavigatorName, ScreenName } from "~/const";
import type { NavigatorScreenParams } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { AnalyticsOptInPromptNavigatorParamList } from "~/components/RootNavigator/types/AnalyticsOptInPromptNavigator";

type TestStackParamList = {
  Previous: undefined;
  AnalyticsOptInPrompt: undefined;
  [NavigatorName.BaseOnboarding]: undefined;
  [NavigatorName.Base]: NavigatorScreenParams<BaseNavigatorStackParamList>;
  [ScreenName.OnboardingNotificationsOptIn]: undefined;
};

const ParentStack = createNativeStackNavigator<TestStackParamList>();
const AnalyticsStack = createNativeStackNavigator<AnalyticsOptInPromptNavigatorParamList>();

const onboardingDeviceSelectionLabel = "Onboarding device selection";
const previousScreenLabel = "Previous onboarding screen";
const portfolioLabel = "Portfolio";
const backButtonLabel = "Back";
const notificationsOptInLabel = "Notifications opt-in";
const acceptAnalyticsButtonId = "enabled-accept-analytics-button";
const refuseAnalyticsLabel = "Refuse all";

function AnalyticsOptInPromptNavigator() {
  return (
    <AnalyticsStack.Navigator initialRouteName={ScreenName.AnalyticsOptInPromptMain}>
      <AnalyticsStack.Screen
        name={ScreenName.AnalyticsOptInPromptMain}
        component={AnalyticsOptInPromptMain}
        initialParams={{ entryPoint: "Onboarding" }}
      />
    </AnalyticsStack.Navigator>
  );
}

function OnboardingDeviceSelectionScreen() {
  return <Text>{onboardingDeviceSelectionLabel}</Text>;
}

function PreviousScreen({ navigation }: NativeStackScreenProps<TestStackParamList, "Previous">) {
  return (
    <Pressable onPress={() => navigation.navigate("AnalyticsOptInPrompt")}>
      <Text>{previousScreenLabel}</Text>
    </Pressable>
  );
}

function PortfolioScreen({
  navigation,
  route,
}: NativeStackScreenProps<TestStackParamList, typeof NavigatorName.Base>) {
  const isPortfolioRoute =
    route.params?.screen === NavigatorName.Main &&
    route.params.params?.screen === NavigatorName.Portfolio &&
    route.params.params.params?.screen === NavigatorName.WalletTab;

  return (
    <>
      <Pressable onPress={() => navigation.goBack()}>
        <Text>{backButtonLabel}</Text>
      </Pressable>
      <Text>{isPortfolioRoute ? portfolioLabel : "Unexpected route"}</Text>
    </>
  );
}

function NotificationsOptInScreen() {
  return <Text>{notificationsOptInLabel}</Text>;
}

const renderAnalyticsOptInMain = ({
  wallet40Enabled,
  lazyOnboarding,
  notificationsOptInEnabled = false,
  initialRouteName = "AnalyticsOptInPrompt",
}: {
  wallet40Enabled: boolean;
  lazyOnboarding?: boolean;
  notificationsOptInEnabled?: boolean;
  initialRouteName?: keyof TestStackParamList;
}) =>
  render(
    <NotificationsPromptProvider>
      <ParentStack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{ headerShown: false, animation: "none" }}
      >
        <ParentStack.Screen name="Previous" component={PreviousScreen} />
        <ParentStack.Screen name="AnalyticsOptInPrompt" component={AnalyticsOptInPromptNavigator} />
        <ParentStack.Screen
          name={NavigatorName.BaseOnboarding}
          component={OnboardingDeviceSelectionScreen}
        />
        <ParentStack.Screen name={NavigatorName.Base} component={PortfolioScreen} />
        <ParentStack.Screen
          name={ScreenName.OnboardingNotificationsOptIn}
          component={NotificationsOptInScreen}
        />
      </ParentStack.Navigator>
    </NotificationsPromptProvider>,
    {
      overrideInitialState: withFlagOverrides({
        lwmWallet40: {
          enabled: wallet40Enabled,
          params: {
            lazyOnboarding,
          },
        },
        lwmNotificationsOptIn: {
          enabled: notificationsOptInEnabled,
        },
      }),
    },
  );

describe("AnalyticsOptInPrompt", () => {
  it("navigates to onboarding device selection when lazy onboarding is disabled", async () => {
    const { user } = renderAnalyticsOptInMain({ wallet40Enabled: true, lazyOnboarding: false });

    await user.press(screen.getByTestId(acceptAnalyticsButtonId));

    expect(await screen.findByText(onboardingDeviceSelectionLabel)).toBeVisible();
  });

  it("navigates to portfolio when lazy onboarding is enabled", async () => {
    const { user } = renderAnalyticsOptInMain({
      wallet40Enabled: true,
      lazyOnboarding: true,
    });

    await user.press(screen.getByTestId(acceptAnalyticsButtonId));

    expect(await screen.findByText(portfolioLabel)).toBeVisible();
  });

  it("navigates to notifications opt-in when lazy onboarding and notifications opt-in are enabled", async () => {
    const { user } = renderAnalyticsOptInMain({
      wallet40Enabled: true,
      lazyOnboarding: true,
      notificationsOptInEnabled: true,
    });

    await user.press(screen.getByTestId(acceptAnalyticsButtonId));

    expect(await screen.findByText(notificationsOptInLabel)).toBeVisible();
  });

  it("keeps onboarding path when Wallet40 is disabled even with lazyOnboarding enabled", async () => {
    const { user } = renderAnalyticsOptInMain({
      wallet40Enabled: false,
      lazyOnboarding: true,
    });

    await user.press(screen.getByTestId(acceptAnalyticsButtonId));

    expect(await screen.findByText(onboardingDeviceSelectionLabel)).toBeVisible();
  });

  it("should reset onboarding history after accepting analytics", async () => {
    const { user } = renderAnalyticsOptInMain({
      wallet40Enabled: true,
      lazyOnboarding: true,
      initialRouteName: "Previous",
    });

    await user.press(screen.getByText(previousScreenLabel));
    await user.press(await screen.findByTestId(acceptAnalyticsButtonId));

    await waitFor(() => expect(screen.getByText(portfolioLabel)).toBeVisible());
    await user.press(screen.getByText(backButtonLabel));

    await waitFor(() => expect(screen.getByText(portfolioLabel)).toBeVisible());
    expect(screen.queryByText(previousScreenLabel)).not.toBeOnTheScreen();
  });

  it("should reset onboarding history after declining analytics", async () => {
    const { user } = renderAnalyticsOptInMain({
      wallet40Enabled: true,
      lazyOnboarding: true,
      initialRouteName: "Previous",
    });

    await user.press(screen.getByText(previousScreenLabel));
    await user.press(await screen.findByText(refuseAnalyticsLabel));

    await waitFor(() => expect(screen.getByText(portfolioLabel)).toBeVisible());
    await user.press(screen.getByText(backButtonLabel));

    await waitFor(() => expect(screen.getByText(portfolioLabel)).toBeVisible());
    expect(screen.queryByText(previousScreenLabel)).not.toBeOnTheScreen();
  });
});
