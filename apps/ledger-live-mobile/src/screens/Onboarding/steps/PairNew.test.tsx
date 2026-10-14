import React from "react";
import { Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { NavigatorName, ScreenName } from "~/const";
import type { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";
import PairNew from "./PairNew";

jest.mock("LLM/features/NotificationsPrompt", () => ({
  useNotificationsPrompt: () => ({ notifyFlowCompleted: jest.fn() }),
}));

jest.mock("./setupDevice/scenes", () => {
  const ReactActual = require("react") as typeof import("react");
  const { Pressable, Text: Label } = require("react-native") as typeof import("react-native");
  return {
    ConnectDevice: ({ onSuccess }: { onSuccess: () => void }) =>
      ReactActual.createElement(
        Pressable,
        { accessibilityLabel: "finish pairing", onPress: onSuccess },
        ReactActual.createElement(Label, null, "finish"),
      ),
  };
});

function Placeholder({ label }: { label: string }) {
  return <Text>{label}</Text>;
}

type TestStackParamList = OnboardingNavigatorParamList & {
  [NavigatorName.Base]: undefined;
};

const Stack = createNativeStackNavigator<TestStackParamList>();

function renderPairNew(connectSeededDevice: boolean | undefined, deviceOnboardingEnabled: boolean) {
  return render(
    <Stack.Navigator screenOptions={{ headerShown: false, animation: "none" }}>
      <Stack.Screen
        name={ScreenName.OnboardingPairNew}
        component={PairNew}
        initialParams={{
          deviceModelId: DeviceModelId.stax,
          fromAccessExistingWallet: true,
          connectSeededDevice,
        }}
      />
      <Stack.Screen name={ScreenName.DeviceOnboardingFunnel}>
        {() => <Placeholder label="seeded funnel" />}
      </Stack.Screen>
      <Stack.Screen name={ScreenName.OnboardingBluetoothInformation}>
        {() => <Placeholder label="bluetooth" />}
      </Stack.Screen>
      <Stack.Screen name={NavigatorName.Base}>
        {() => <Placeholder label="portfolio" />}
      </Stack.Screen>
    </Stack.Navigator>,
    {
      overrideInitialState: withFlagOverrides({
        deviceOnboarding: {
          enabled: deviceOnboardingEnabled,
          params: { connectSeededDevice: true },
        },
      }),
    },
  );
}

describe("PairNew", () => {
  it.each([
    ["the flag is off", false, true],
    ["connectSeededDevice is off", true, false],
  ] as const)("should complete onboarding when %s", async (_, flagEnabled, connectSeededDevice) => {
    const { user, store } = renderPairNew(connectSeededDevice, flagEnabled);

    await user.press(screen.getByLabelText("finish pairing"));

    expect(await screen.findByText("portfolio")).toBeVisible();
    expect(screen.queryByText("seeded funnel")).toBeNull();
    expect(store.getState().settings.hasCompletedOnboarding).toBe(true);
  });

  it("should open the seeded funnel without completing when the funnel is on", async () => {
    const { user, store } = renderPairNew(true, true);

    await user.press(screen.getByLabelText("finish pairing"));

    expect(await screen.findByText("seeded funnel")).toBeVisible();
    expect(store.getState().settings.hasCompletedOnboarding).toBe(false);
  });
});
