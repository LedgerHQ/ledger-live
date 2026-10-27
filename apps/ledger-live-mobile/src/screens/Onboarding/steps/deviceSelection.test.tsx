import React from "react";
import { Linking, Platform, Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { render, screen } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import type { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";
import type { State } from "~/reducers/types";
import OnboardingDeviceSelection from "./deviceSelection";

const Stack = createNativeStackNavigator<OnboardingNavigatorParamList>();
const originalPlatform = Platform.OS;

function renderSelection(missingDevice: boolean, language = "en") {
  return render(
    <Stack.Navigator screenOptions={{ headerShown: false, animation: "none" }}>
      <Stack.Screen
        name={ScreenName.OnboardingDeviceSelection}
        component={OnboardingDeviceSelection}
        initialParams={missingDevice ? { missingDevice: true } : undefined}
      />
      <Stack.Screen name={ScreenName.OnboardingUseCase}>
        {({ route }) => <Text>{`nano onboarding ${route.params.deviceModelId}`}</Text>}
      </Stack.Screen>
      <Stack.Screen name={ScreenName.OnboardingBleDevicePairingFlow}>
        {() => <Text>bluetooth pairing</Text>}
      </Stack.Screen>
    </Stack.Navigator>,
    {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: { ...state.settings, language },
      }),
    },
  );
}

describe("OnboardingDeviceSelection", () => {
  const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);

  afterEach(() => {
    Platform.OS = originalPlatform;
    openURL.mockClear();
  });

  it("should open the localized help article for a touchscreen device", async () => {
    const { user } = renderSelection(true, "fr");

    await user.press(screen.getByTestId("onboarding-device-selection-stax"));

    expect(openURL).toHaveBeenCalledWith("https://support.ledger.com/fr/article/360025864773-zd");
    expect(screen.queryByText("bluetooth pairing")).toBeNull();
  });

  it("should open the old nano onboarding without pairing", async () => {
    const { user } = renderSelection(true);

    await user.press(screen.getByTestId("onboarding-device-selection-nanoX"));

    expect(await screen.findByText("nano onboarding nanoX")).toBeVisible();
    expect(openURL).not.toHaveBeenCalled();
    expect(screen.queryByText("bluetooth pairing")).toBeNull();
  });

  it("should keep the iOS drawer for a Nano that cannot connect", async () => {
    Platform.OS = "ios";
    const { user } = renderSelection(true);

    await user.press(screen.getByTestId("onboarding-device-selection-nanoS"));

    expect(
      await screen.findByText("Ledger Nano S and Ledger Nano S Plus not supported on iOS devices"),
    ).toBeVisible();
    expect(openURL).not.toHaveBeenCalled();
    expect(screen.queryByText(/nano onboarding/)).toBeNull();
  });

  it("should keep bluetooth pairing when the list is not opened from a missing device", async () => {
    const { user } = renderSelection(false);

    await user.press(screen.getByTestId("onboarding-device-selection-stax"));

    expect(await screen.findByText("bluetooth pairing")).toBeVisible();
    expect(openURL).not.toHaveBeenCalled();
  });
});
