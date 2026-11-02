import React from "react";
import { Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { track, trackPage } from "@shared/analytics";
import { render, screen } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import type {
  OnboardingEntrySource,
  OnboardingNavigatorParamList,
} from "~/components/RootNavigator/types/OnboardingNavigator";
import PostWelcomeSelection from "./postWelcomeSelection";

const Stack = createNativeStackNavigator<OnboardingNavigatorParamList>();

function renderGetStarted(source?: OnboardingEntrySource) {
  return render(
    <Stack.Navigator screenOptions={{ headerShown: false, animation: "none" }}>
      <Stack.Screen
        name={ScreenName.OnboardingPostWelcomeSelection}
        component={PostWelcomeSelection}
        initialParams={{ userHasDevice: true, source }}
      />
      <Stack.Screen name={ScreenName.OnboardingDeviceSelection}>
        {() => <Text>device selection</Text>}
      </Stack.Screen>
      <Stack.Screen name={ScreenName.OnboardingWelcomeBack}>
        {() => <Text>welcome back</Text>}
      </Stack.Screen>
    </Stack.Navigator>,
  );
}

describe("PostWelcomeSelection", () => {
  afterEach(() => {
    jest.mocked(track).mockClear();
    jest.mocked(trackPage).mockClear();
  });

  it("should send the source with the screen view and both cards", async () => {
    const { user } = renderGetStarted("portfolio");

    expect(trackPage).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Get Started", props: { source: "portfolio" } }),
      expect.anything(),
    );

    await user.press(screen.getByTestId("onboarding-setupLedger"));
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Setup your Ledger",
      source: "portfolio",
    });
    expect(await screen.findByText("device selection")).toBeVisible();
  });

  it("should send the source when the user opens an existing wallet", async () => {
    const { user } = renderGetStarted("portfolio");

    await user.press(screen.getByTestId("onboarding-accessWallet"));

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Access an existing wallet",
      source: "portfolio",
    });
  });

  it("should keep today's events when no source is given", async () => {
    const { user } = renderGetStarted();

    expect(trackPage).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Get Started", props: {} }),
      expect.anything(),
    );

    await user.press(screen.getByTestId("onboarding-setupLedger"));
    expect(track).toHaveBeenCalledWith("button_clicked", { button: "Setup your Ledger" });
  });
});
