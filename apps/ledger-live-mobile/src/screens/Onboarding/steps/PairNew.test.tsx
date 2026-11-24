import React from "react";
import { Text } from "react-native";
import type { InitialState } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { NavigatorName, ScreenName } from "~/const";
import type { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";
import type { State } from "~/reducers/types";
import PairNew from "./PairNew";

jest.mock("LLM/features/NotificationsPrompt", () => ({
  useNotificationsPrompt: () => ({ notifyFlowCompleted: jest.fn() }),
}));

jest.mock("~/hooks/deviceActions", () => ({
  useManagerDeviceAction: () => ({}),
}));

jest.mock("~/components/SelectDevice2", () => {
  const { Pressable, Text: Label } = jest.requireActual("react-native");

  return function SelectDevice2Mock({
    onSelect,
  }: {
    onSelect: (device: {
      deviceId: string;
      deviceName: string;
      modelId: DeviceModelId;
      wired: boolean;
    }) => void;
  }) {
    return (
      <Pressable
        accessibilityLabel="select device"
        onPress={() =>
          onSelect({
            deviceId: "paired-id",
            deviceName: "Ledger Stax",
            modelId: DeviceModelId.stax,
            wired: false,
          })
        }
      >
        <Label>select device</Label>
      </Pressable>
    );
  };
});

jest.mock("~/components/DeviceAction", () => {
  const { Pressable, Text: Label } = jest.requireActual("react-native");

  return function DeviceActionMock({
    onResult,
  }: {
    onResult?: (payload: { result: { installed: string[] } }) => void;
  }) {
    return (
      <Pressable
        accessibilityLabel="finish pairing"
        onPress={() => onResult?.({ result: { installed: [] } })}
      >
        <Label>finish pairing</Label>
      </Pressable>
    );
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
  readOnlyModeEnabled = false,
  params: Partial<OnboardingNavigatorParamList[ScreenName.OnboardingPairNew]> = {},
  navigationInitialState?: InitialState,
) {
  return render(
    <Stack.Navigator screenOptions={{ headerShown: false, animation: "none" }}>
      <Stack.Screen
        name={ScreenName.OnboardingPairNew}
        component={PairNew}
        initialParams={{
          deviceModelId: DeviceModelId.stax,
          fromAccessExistingWallet: true,
          ...params,
        }}
      />
      <Stack.Screen name={ScreenName.OnboardingBluetoothInformation}>
        {() => <Placeholder label="bluetooth" />}
      </Stack.Screen>
      <Stack.Screen name={NavigatorName.Base}>
        {() => <Placeholder label="portfolio" />}
      </Stack.Screen>
      <Stack.Screen name={ScreenName.OnboardingWelcome}>
        {() => <Placeholder label="welcome" />}
      </Stack.Screen>
    </Stack.Navigator>,
    {
      navigationInitialState,
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...state.settings,
          readOnlyModeEnabled,
          hasBeenRedirectedToPostOnboarding: true,
        },
      }),
    },
  );
}

describe("PairNew", () => {
  it("should complete onboarding when the device is paired", async () => {
    const { user, store } = renderPairNew();

    await pair(user);

    expect(await screen.findByText("portfolio")).toBeVisible();
    expect(store.getState().settings.hasCompletedOnboarding).toBe(true);
  });

  it("should let pairing clear read-only mode", async () => {
    const { user, store } = renderPairNew(true);

    await user.press(screen.getByLabelText("select device"));

    expect(store.getState().settings.readOnlyModeEnabled).toBe(false);
  });

  it("should go back to the welcome screen it was opened on", async () => {
    const { user } = renderPairNew(
      false,
      {},
      {
        index: 1,
        routes: [
          { name: ScreenName.OnboardingWelcome },
          {
            name: ScreenName.OnboardingPairNew,
            params: { deviceModelId: DeviceModelId.nanoS, fromAccessExistingWallet: true },
          },
        ],
      },
    );

    await user.press(screen.getByTestId("onboarding-pair-new-back"));

    expect(await screen.findByText("welcome")).toBeVisible();
  });

  it("should keep the post-onboarding redirect of an existing wallet as it was", async () => {
    const { user, store } = renderPairNew();

    await pair(user);

    expect(await screen.findByText("portfolio")).toBeVisible();
    expect(store.getState().settings.hasBeenRedirectedToPostOnboarding).toBe(true);
  });

  it("should send a read-only user to post-onboarding after pairing", async () => {
    const { user, store } = renderPairNew(true, { resetPostOnboardingRedirect: true });

    await pair(user);

    expect(await screen.findByText("portfolio")).toBeVisible();
    expect(store.getState().settings.hasBeenRedirectedToPostOnboarding).toBe(false);
  });
});

async function pair(user: ReturnType<typeof render>["user"]) {
  await user.press(screen.getByLabelText("select device"));
  await user.press(await screen.findByLabelText("finish pairing"));
}
