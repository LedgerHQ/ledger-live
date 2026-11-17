import React from "react";
import { Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { getDeviceModel } from "@ledgerhq/devices";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { render, screen } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import type { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";
import OnboardingBleDevicePairingFlow from "./BleDevicePairingFlow";

const Stack = createNativeStackNavigator<OnboardingNavigatorParamList>();

function renderPairingFlow(
  initialParams?: OnboardingNavigatorParamList[ScreenName.OnboardingBleDevicePairingFlow],
) {
  return render(
    <Stack.Navigator screenOptions={{ headerShown: false, animation: "none" }}>
      <Stack.Screen
        name={ScreenName.OnboardingBleDevicePairingFlow}
        component={OnboardingBleDevicePairingFlow}
        initialParams={initialParams}
      />
      <Stack.Screen name={ScreenName.OnboardingWelcome}>{() => <Text>welcome</Text>}</Stack.Screen>
    </Stack.Navigator>,
  );
}

describe("OnboardingBleDevicePairingFlow", () => {
  it("should scan for touchscreen devices when opened from the sync-onboarding deep link", async () => {
    renderPairingFlow();

    expect(await screen.findByText("Looking for devices")).toBeVisible();
  });

  it("should scan for the device model it was opened with", async () => {
    renderPairingFlow({ filterByDeviceModelId: DeviceModelId.europa });

    const { productName } = getDeviceModel(DeviceModelId.europa);
    expect(await screen.findByText(`Looking for ${productName}...`)).toBeVisible();
  });
});
