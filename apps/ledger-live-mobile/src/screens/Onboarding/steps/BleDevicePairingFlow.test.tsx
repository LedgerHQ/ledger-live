import React from "react";
import { Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { render, screen } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import type { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";
import OnboardingBleDevicePairingFlow from "./BleDevicePairingFlow";

jest.mock("~/components/BleDevicePairingFlow", () => ({
  __esModule: true,
  default: ({ filterByDeviceModelId }: { filterByDeviceModelId: unknown }) => {
    const { Text } = jest.requireActual("react-native");
    return <Text>{`pairing ${JSON.stringify(filterByDeviceModelId)}`}</Text>;
  },
}));

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
  it("should scan for touchscreen devices when opened from the sync-onboarding deep link", () => {
    renderPairingFlow();

    expect(
      screen.getByText(`pairing ${JSON.stringify([DeviceModelId.stax, DeviceModelId.europa])}`),
    ).toBeVisible();
  });

  it("should scan for the device model it was opened with", () => {
    renderPairingFlow({ filterByDeviceModelId: DeviceModelId.europa });

    expect(screen.getByText(`pairing "${DeviceModelId.europa}"`)).toBeVisible();
  });
});
