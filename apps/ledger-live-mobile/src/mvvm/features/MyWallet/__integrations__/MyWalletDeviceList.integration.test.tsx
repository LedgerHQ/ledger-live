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
import {
  buildMockServerCompatDeviceId,
  type DeviceConnectionResult,
} from "@ledgerhq/live-dmk-shared";
import { act, render, screen, withFlagOverrides } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import { isMainNavigatorVisibleSelector } from "~/reducers/appstate";
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

function renderMyWallet(initialParams?: object) {
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
    </Stack.Navigator>,
    { overrideInitialState: withFlagOverrides({ lwmMyWalletDeviceList: { enabled: true } }) },
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

  it("GIVEN the device list, WHEN a mock server device connects, THEN it should open the device action without the lock check", () => {
    // GIVEN
    const mockServerDeviceId = buildMockServerCompatDeviceId("mock-device");
    renderMyWallet();
    emit(discovering);

    // WHEN
    connect(makeConnectionResult(mockServerDeviceId));

    // THEN
    expect(screen.getByText(`Device action for ${mockServerDeviceId}`)).toBeVisible();
    expect(screen.queryByText(`Unlock ${mockServerDeviceId}`)).toBeNull();
  });

  it("GIVEN the device list, WHEN the Add mode starts and then ends, THEN it should hide the other sections and the tab bar, then show them again", () => {
    // GIVEN
    const { store, onPairingStateChanged } = renderMyWallet();
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
    expect(isMainNavigatorVisibleSelector(store.getState())).toBe(false);

    // WHEN
    emit(discovering);

    // THEN
    expect(onPairingStateChanged).toHaveBeenLastCalledWith(false);
    expect(isMainNavigatorVisibleSelector(store.getState())).toBe(true);
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
    renderMyWallet({ device });

    // THEN
    expect(screen.getByText("Device action for redirected-id")).toBeVisible();
  });
});
