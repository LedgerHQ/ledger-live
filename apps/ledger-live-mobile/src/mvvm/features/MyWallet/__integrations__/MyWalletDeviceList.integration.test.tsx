import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DeviceModelId } from "@ledgerhq/devices";
import { DeviceModelId as DMKDeviceModelId } from "@ledgerhq/device-management-kit";
import {
  connectKnownOrNewDevice,
  ConnectKnownOrNewDeviceUIStateTypes,
  ConnectNewDeviceUIStateTypes,
  rnBleTransportIdentifier,
  useDeviceManagementKit,
  type ConnectKnownOrNewDeviceUIState,
} from "@ledgerhq/live-dmk-mobile";
import type { DeviceConnectionResult } from "@ledgerhq/live-dmk-shared";
import { trackPage } from "@shared/analytics";
import { act, render, screen, withFlagOverrides } from "@tests/test-renderer";
import { BaseOnboardingTestScreens } from "@tests/OnboardingTestScreens";
import { NavigatorName, ScreenName } from "~/const";
import { MyLedgerSection } from "../views/MyLedgerSection";

jest.mock("@ledgerhq/live-dmk-mobile", () => ({
  ...jest.requireActual("@ledgerhq/live-dmk-mobile"),
  connectKnownOrNewDevice: jest.fn(),
  useDeviceManagementKit: jest.fn(),
}));

// Both talk to the device through the legacy transports, which Jest does not have.
jest.mock("~/components/SelectDevice2/DeviceLockedCheckDrawer", () => {
  const { createElement } = jest.requireActual<typeof import("react")>("react");
  const { Pressable, Text } = jest.requireActual<typeof import("react-native")>("react-native");
  return {
    DeviceLockedCheckDrawer: ({
      isOpen,
      device,
      onDeviceUnlocked,
      onClose,
    }: {
      isOpen: boolean;
      device: { deviceId: string } | null;
      onDeviceUnlocked: () => void;
      onClose: () => void;
    }) =>
      isOpen && device
        ? createElement(
            Pressable,
            {
              onPress: () => {
                onDeviceUnlocked();
                onClose();
              },
            },
            createElement(Text, null, `Unlock ${device.deviceId}`),
          )
        : null,
  };
});

jest.mock("~/components/DeviceActionModal", () => {
  const { createElement } = jest.requireActual<typeof import("react")>("react");
  const { Pressable, Text } = jest.requireActual<typeof import("react-native")>("react-native");
  return {
    __esModule: true,
    default: ({ device, onClose }: { device?: { deviceId: string }; onClose: () => void }) =>
      device
        ? createElement(
            Pressable,
            { onPress: onClose },
            createElement(Text, null, `Device action for ${device.deviceId}`),
          )
        : null,
  };
});

const mockedConnectKnownOrNewDevice = jest.mocked(connectKnownOrNewDevice);
const mockDmk = { id: "dmk" } as unknown as NonNullable<ReturnType<typeof useDeviceManagementKit>>;
const pause = jest.fn();
const resume = jest.fn();

let emitState: ((state: ConnectKnownOrNewDeviceUIState) => void) | undefined;

function emit(state: ConnectKnownOrNewDeviceUIState) {
  act(() => emitState?.(state));
}

function connect(result: DeviceConnectionResult) {
  act(() => mockedConnectKnownOrNewDevice.mock.lastCall?.[0].onConnected(result));
}

const discovering: ConnectKnownOrNewDeviceUIState = {
  type: ConnectKnownOrNewDeviceUIStateTypes.Discovering,
  isPaused: false,
  devices: [],
  addNewDevice: jest.fn(),
};

function makeConnectionResult(compatDeviceId: string): DeviceConnectionResult {
  return {
    dmk: mockDmk,
    sessionId: "session-id",
    compatDeviceId,
    compatDeviceName: "My Nano X",
    compatDeviceWired: false,
    connectedDevice: {
      id: "nano-x-id",
      name: "My Nano X",
      modelId: DMKDeviceModelId.NANO_X,
      sessionId: "session-id",
      type: "BLE",
      transport: rnBleTransportIdentifier,
    } as DeviceConnectionResult["connectedDevice"],
  };
}

const Stack = createNativeStackNavigator();

function renderMyWallet({
  initialParams,
  unifiedEntryPoints = false,
}: { initialParams?: object; unifiedEntryPoints?: boolean } = {}) {
  const onPairingStateChanged = jest.fn();
  function MyWalletTestScreen() {
    return <MyLedgerSection onPairingStateChanged={onPairingStateChanged} />;
  }
  const view = render(
    <Stack.Navigator>
      <Stack.Screen
        name={ScreenName.MyWallet}
        component={MyWalletTestScreen}
        initialParams={initialParams}
      />
      <Stack.Screen name={NavigatorName.BaseOnboarding} component={BaseOnboardingTestScreens} />
    </Stack.Navigator>,
    {
      overrideInitialState: withFlagOverrides({
        lwmMyWalletDeviceList: { enabled: true },
        deviceOnboarding: { enabled: true, params: { unifiedEntryPoints } },
      }),
    },
  );
  return { ...view, onPairingStateChanged };
}

describe("MyWalletDeviceList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    emitState = undefined;
    jest.mocked(useDeviceManagementKit).mockReturnValue(mockDmk);
    mockedConnectKnownOrNewDevice.mockReturnValue({
      uiStates: {
        subscribe: jest.fn(({ next }) => {
          emitState = next;
          return { unsubscribe: jest.fn() };
        }),
      } as unknown as ReturnType<typeof connectKnownOrNewDevice>["uiStates"],
      pause,
      resume,
    });
  });

  it("GIVEN the device list, WHEN a device connects, THEN it should pause the list, check the lock and then open the My Ledger device action", async () => {
    // GIVEN
    const { user } = renderMyWallet();
    emit(discovering);
    pause.mockClear();

    // WHEN
    connect(makeConnectionResult("nano-x-id"));

    // THEN
    expect(screen.getByText("Unlock nano-x-id")).toBeVisible();
    expect(screen.queryByText("Device action for nano-x-id")).toBeNull();
    expect(pause).toHaveBeenCalled();

    // WHEN
    await user.press(screen.getByText("Unlock nano-x-id"));

    // THEN
    expect(screen.getByText("Device action for nano-x-id")).toBeVisible();
    expect(screen.queryByText("Unlock nano-x-id")).toBeNull();

    // WHEN
    resume.mockClear();
    await user.press(screen.getByText("Device action for nano-x-id"));

    // THEN
    expect(screen.queryByText("Device action for nano-x-id")).toBeNull();
    expect(resume).toHaveBeenCalled();
  });

  it("GIVEN the device list, WHEN the Add mode starts and then ends, THEN it should hide the other sections, then show them again", () => {
    // GIVEN
    const { onPairingStateChanged } = renderMyWallet();
    emit(discovering);

    // WHEN
    emit({
      type: ConnectKnownOrNewDeviceUIStateTypes.ConnectNewDevice,
      connectNewDeviceUIState: {
        type: ConnectNewDeviceUIStateTypes.Discovering,
        devices: [],
        scanningTransports: [rnBleTransportIdentifier],
        showDeviceNotFound: false,
      },
      close: jest.fn(),
    });

    // THEN
    expect(onPairingStateChanged).toHaveBeenLastCalledWith(true);

    // WHEN
    emit(discovering);

    // THEN
    expect(onPairingStateChanged).toHaveBeenLastCalledWith(false);
  });

  it("GIVEN a redirect with a device, WHEN My Wallet opens, THEN it should open the device action at once", () => {
    // GIVEN
    const device = {
      deviceId: "redirected-id",
      deviceName: "My Stax",
      modelId: DeviceModelId.stax,
      wired: false,
    };

    // WHEN
    renderMyWallet({ initialParams: { device } });

    // THEN
    expect(screen.getByText("Device action for redirected-id")).toBeVisible();
  });

  it("GIVEN onboarding owns the Add entry point, WHEN the flow replaces the Add mode with no device, THEN it should open Get Started", async () => {
    // GIVEN
    renderMyWallet({ unifiedEntryPoints: true });
    emit(discovering);

    // WHEN
    act(() => mockedConnectKnownOrNewDevice.mock.lastCall?.[0].onAddNewDevice?.(false));

    // THEN
    expect(await screen.findByTestId("onboarding-setupLedger")).toBeVisible();
    expect(trackPage).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Get Started", props: { source: "my_wallet_empty" } }),
      expect.anything(),
    );
  });

  it("GIVEN onboarding does not own the Add entry point, WHEN the flow starts, THEN it should keep the Add mode", () => {
    // GIVEN / WHEN
    renderMyWallet();

    // THEN
    expect(mockedConnectKnownOrNewDevice.mock.lastCall?.[0].onAddNewDevice).toBeUndefined();
  });
});
