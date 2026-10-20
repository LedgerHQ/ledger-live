import React from "react";
import { View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { render, screen } from "@tests/test-renderer";
import { NavigatorName } from "~/const";
import UpsellFlex from "../screens/UpsellFlex";

jest.mock("react-native-video", () => {
  const ReactActual = jest.requireActual<typeof import("react")>("react");
  const { View: RNView } = jest.requireActual<typeof import("react-native")>("react-native");

  const Video = () => ReactActual.createElement(RNView, { testID: "upsell-flex-video" });

  return { __esModule: true, default: Video };
});

jest.mock("~/components/useIsAppInBackground", () => ({
  __esModule: true,
  default: () => false,
}));

const Stack = createNativeStackNavigator();

const OnboardingStub = () => <View testID="onboarding-stub" />;

const MockNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen name="UpsellFlex" component={UpsellFlex} />
    <Stack.Screen name={NavigatorName.BaseOnboarding} component={OnboardingStub} />
  </Stack.Navigator>
);

describe("UpsellFlex video", () => {
  it("should play the video while the screen is focused", () => {
    render(<MockNavigator />);

    expect(screen.getByTestId("upsell-flex-video")).toBeOnTheScreen();
  });

  it("should unmount the video once another screen covers it", async () => {
    const { user } = render(<MockNavigator />);

    await user.press(screen.getByTestId("getDevice-setup-button"));

    expect(await screen.findByTestId("onboarding-stub")).toBeOnTheScreen();
    expect(
      screen.queryByTestId("upsell-flex-video", { includeHiddenElements: true }),
    ).not.toBeOnTheScreen();
  });
});
