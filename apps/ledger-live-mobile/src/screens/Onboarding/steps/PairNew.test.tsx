import React from "react";
import { Pressable, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DeviceModelId as DMKDeviceModelId } from "@ledgerhq/device-management-kit";
import { act, render, screen, withFlagOverrides } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  connectNewDevice,
  ConnectNewDeviceUIStateTypes,
  rnBleTransportIdentifier,
  useDeviceManagementKit,
  type ConnectNewDeviceUIState,
} from "@ledgerhq/live-dmk-mobile";
import type { DeviceConnectionResult } from "@ledgerhq/live-dmk-shared";
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

jest.mock("@ledgerhq/live-dmk-mobile", () => {
  const actual = jest.requireActual("@ledgerhq/live-dmk-mobile");

  return {
    ...actual,
    connectNewDevice: jest.fn(),
    useDeviceManagementKit: jest.fn(),
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

function DeviceSelection({ route }: { route: { params?: { missingDevice?: boolean } } }) {
  const navigation = useNavigation<NavigationProp<TestStackParamList>>();

  return (
    <Pressable accessibilityLabel="back to connect" onPress={() => navigation.goBack()}>
      <Text>
        {route.params?.missingDevice
          ? "Select the Ledger you want to set up:"
          : "old device selection"}
      </Text>
    </Pressable>
  );
}

function WelcomeBack() {
  const navigation = useNavigation<NavigationProp<TestStackParamList>>();

  return (
    <Pressable
      accessibilityLabel="open connect"
      onPress={() =>
        navigation.navigate(ScreenName.OnboardingPairNew, {
          deviceModelId: DeviceModelId.stax,
          fromAccessExistingWallet: true,
          connectSeededDevice: true,
        })
      }
    >
      <Text>welcome back</Text>
    </Pressable>
  );
}

type TestStackParamList = OnboardingNavigatorParamList & {
  [NavigatorName.Base]: undefined;
};

const Stack = createNativeStackNavigator<TestStackParamList>();

const mockedConnectNewDevice = jest.mocked(connectNewDevice);
const mockDmk = { id: "dmk" } as unknown as NonNullable<ReturnType<typeof useDeviceManagementKit>>;

let emitState: ((state: ConnectNewDeviceUIState) => void) | undefined;
let unsubscribe: jest.Mock;

const pairedDevice = {
  id: "paired-id",
  name: "Ledger Stax",
  deviceModelId: DeviceModelId.stax,
  transport: rnBleTransportIdentifier,
};

function connectionResult(): DeviceConnectionResult {
  return {
    dmk: mockDmk,
    sessionId: "session-id",
    compatDeviceId: pairedDevice.id,
    compatDeviceName: pairedDevice.name,
    compatDeviceWired: false,
    connectedDevice: {
      id: pairedDevice.id,
      name: pairedDevice.name,
      modelId: DMKDeviceModelId.STAX,
      sessionId: "session-id",
      type: "BLE",
      transport: rnBleTransportIdentifier,
    } as DeviceConnectionResult["connectedDevice"],
  };
}

function emit(state: ConnectNewDeviceUIState) {
  act(() => emitState?.(state));
}

function renderPairNew(
  connectSeededDevice: boolean | undefined,
  deviceOnboardingEnabled: boolean,
  readOnlyModeEnabled = false,
  fromWelcome = false,
) {
  return render(
    <Stack.Navigator
      initialRouteName={
        fromWelcome ? ScreenName.OnboardingWelcomeBack : ScreenName.OnboardingPairNew
      }
      screenOptions={{ headerShown: false, animation: "none" }}
    >
      <Stack.Screen name={ScreenName.OnboardingWelcomeBack} component={WelcomeBack} />
      <Stack.Screen
        name={ScreenName.OnboardingPairNew}
        component={PairNew}
        initialParams={
          fromWelcome
            ? undefined
            : {
                deviceModelId: DeviceModelId.stax,
                fromAccessExistingWallet: true,
                connectSeededDevice,
              }
        }
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
      <Stack.Screen name={ScreenName.OnboardingDeviceSelection} component={DeviceSelection} />
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
  beforeEach(() => {
    jest.mocked(useDeviceManagementKit).mockReturnValue(mockDmk);
    emitState = undefined;
    unsubscribe = jest.fn();
    mockedConnectNewDevice.mockClear();
    mockedConnectNewDevice.mockReturnValue({
      subscribe: jest.fn(({ next }) => {
        emitState = next;
        return { unsubscribe };
      }),
    } as unknown as ReturnType<typeof connectNewDevice>);
  });

  it.each([
    ["the flag is off", false, true],
    ["connectSeededDevice is off", true, false],
  ] as const)("should complete onboarding when %s", async (_, flagEnabled, connectSeededDevice) => {
    const { user, store } = renderPairNew(connectSeededDevice, flagEnabled);

    await pair(user);

    expect(await screen.findByText("portfolio")).toBeVisible();
    expect(screen.queryByText(/seeded funnel/)).toBeNull();
    expect(store.getState().settings.hasCompletedOnboarding).toBe(true);
  });

  it("should go back to the previous screen when close is pressed", async () => {
    const { user } = renderPairNew(true, true, false, true);

    await user.press(screen.getByLabelText("open connect"));
    expect(await screen.findByText("Looking for your Ledger devices")).toBeVisible();
    emit({ type: ConnectNewDeviceUIStateTypes.Connected, device: pairedDevice });
    expect(await screen.findByText("Your device is paired")).toBeVisible();

    await user.press(screen.getByTestId("onboarding-connect-close"));

    expect(await screen.findByText("welcome back")).toBeVisible();
    expect(screen.queryByText("Your device is paired")).toBeNull();
  });

  it("should open device selection when the device is not found", async () => {
    const { user } = renderPairNew(true, true);

    expect(await screen.findByText("Looking for your Ledger devices")).toBeVisible();
    emit({
      type: ConnectNewDeviceUIStateTypes.Discovering,
      devices: [],
      scanningTransports: [rnBleTransportIdentifier],
      showDeviceNotFound: true,
    });

    await user.press(screen.getByText("I don’t see my device"));

    expect(await screen.findByText("Select the Ledger you want to set up:")).toBeVisible();
    expect(unsubscribe).toHaveBeenCalledTimes(1);

    await user.press(screen.getByLabelText("back to connect"));

    expect(await screen.findByText("Looking for your Ledger devices")).toBeVisible();
    expect(mockedConnectNewDevice).toHaveBeenCalledTimes(2);
  });

  it("should open the seeded funnel when the new screen connects", async () => {
    const { user, store } = renderPairNew(true, true, true);
    const result = connectionResult();

    expect(await screen.findByText("Looking for your Ledger devices")).toBeVisible();
    emit({
      type: ConnectNewDeviceUIStateTypes.Discovering,
      devices: [
        {
          key: pairedDevice.id,
          device: pairedDevice,
          isAvailable: true,
          onSelect: () => mockedConnectNewDevice.mock.calls.at(-1)?.[0].onConnected(result),
        },
      ],
      scanningTransports: [rnBleTransportIdentifier],
      showDeviceNotFound: false,
    });
    await user.press(screen.getByLabelText("Connect Ledger Stax"));

    expect(await screen.findByText("seeded funnel paired-id true")).toBeVisible();
    expect(store.getState().settings.hasCompletedOnboarding).toBe(false);
    expect(store.getState().settings.readOnlyModeEnabled).toBe(true);
  });

  it("should let pairing clear read-only mode when the funnel is off", async () => {
    const { user, store } = renderPairNew(true, false, true);

    await user.press(screen.getByLabelText("select device"));

    expect(store.getState().settings.readOnlyModeEnabled).toBe(false);
  });
});

async function pair(user: ReturnType<typeof render>["user"]) {
  await user.press(screen.getByLabelText("select device"));
  await user.press(await screen.findByLabelText("finish pairing"));
}
