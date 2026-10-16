import React from "react";
import { Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { NavigatorName, ScreenName } from "~/const";
import type { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";
import type { State } from "~/reducers/types";
import PairNew from "./PairNew";

jest.mock("LLM/features/NotificationsPrompt", () => ({
  useNotificationsPrompt: () => ({ notifyFlowCompleted: jest.fn() }),
}));

jest.mock("./setupDevice/scenes", () => {
  const ReactActual = require("react") as typeof import("react");
  const { Pressable, Text: Label } = require("react-native") as typeof import("react-native");
  return {
    ConnectDevice: ({
      onSuccess,
      keepReadOnlyMode,
    }: {
      onSuccess: (device?: { deviceId: string }) => void;
      keepReadOnlyMode?: boolean;
    }) =>
      ReactActual.createElement(
        Pressable,
        {
          accessibilityLabel: "finish pairing",
          onPress: () => onSuccess({ deviceId: "paired-id" }),
        },
        ReactActual.createElement(Label, null, `keeps read-only: ${String(keepReadOnlyMode)}`),
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

function renderPairNew(
  connectSeededDevice: boolean | undefined,
  deviceOnboardingEnabled: boolean,
  readOnlyModeEnabled = false,
) {
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
        {({ route }) => (
          <Placeholder
            label={`seeded funnel ${route.params.pairedDeviceId} ${String(route.params.wasReadOnlyAtEntry)}`}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name={ScreenName.OnboardingBluetoothInformation}>
        {() => <Placeholder label="bluetooth" />}
      </Stack.Screen>
      <Stack.Screen name={NavigatorName.Base}>
        {() => <Placeholder label="portfolio" />}
      </Stack.Screen>
    </Stack.Navigator>,
    {
      overrideInitialState: withFlagOverrides(
        {
          deviceOnboarding: {
            enabled: deviceOnboardingEnabled,
            params: { connectSeededDevice: true },
          },
        },
        (state: State) => ({
          ...state,
          settings: { ...state.settings, readOnlyModeEnabled },
        }),
      ),
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
    expect(screen.queryByText(/seeded funnel/)).toBeNull();
    expect(store.getState().settings.hasCompletedOnboarding).toBe(true);
  });

  it("should hand the paired device to the seeded funnel without completing", async () => {
    const { user, store } = renderPairNew(true, true, true);

    expect(screen.getByText("keeps read-only: true")).toBeVisible();
    await user.press(screen.getByLabelText("finish pairing"));

    expect(await screen.findByText("seeded funnel paired-id true")).toBeVisible();
    expect(store.getState().settings.hasCompletedOnboarding).toBe(false);
    expect(store.getState().settings.readOnlyModeEnabled).toBe(true);
  });

  it("should let pairing clear read-only mode when the funnel is off", () => {
    renderPairNew(true, false, true);

    expect(screen.getByText("keeps read-only: false")).toBeVisible();
  });
});
