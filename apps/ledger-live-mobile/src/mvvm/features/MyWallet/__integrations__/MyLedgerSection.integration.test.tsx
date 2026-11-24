import React from "react";
import { Text } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DeviceModelId } from "@ledgerhq/devices";
import { trackPage } from "@shared/analytics";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import { BaseOnboardingTestScreens } from "@tests/OnboardingTestScreens";
import { NavigatorName, ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import { MyLedgerSection } from "../views/MyLedgerSection";

// Jest has no USB transport: this is the only way to show a plugged device.
const mockHidDevices = jest.fn(() => [] as unknown[]);
jest.mock("@ledgerhq/live-dmk-mobile", () => ({
  ...jest.requireActual("@ledgerhq/live-dmk-mobile"),
  useHidDevicesDiscovery: () => ({ hidDevices: mockHidDevices(), error: null }),
}));

// The connection itself is out of scope: the modal only shows the device it is asked to connect,
// and like the real one hides before it hands its result over.
type ModalProps = {
  device?: { deviceId: string };
  onResult: (result: unknown) => void;
  onClose: () => void;
  onModalHide: () => void;
};
jest.mock("~/components/DeviceActionModal", () => {
  const { Text: MockText } = jest.requireActual("react-native");
  return {
    __esModule: true,
    default: ({ device, onResult, onClose, onModalHide }: ModalProps) => (
      <>
        <MockText testID="connecting">{device?.deviceId ?? "none"}</MockText>
        <MockText
          onPress={() => {
            onModalHide();
            onResult({ device, result: {} });
          }}
        >
          complete
        </MockText>
        <MockText
          onPress={() => {
            onClose();
            onModalHide();
          }}
        >
          close
        </MockText>
      </>
    ),
  };
});

const Stack = createNativeStackNavigator();

const knownDevice = { id: "stax-id", name: "Stax 4CE9", modelId: DeviceModelId.stax };

function renderSection({
  unifiedEntryPoints,
  withDevice,
}: {
  unifiedEntryPoints: boolean;
  withDevice: boolean;
}) {
  return render(
    <Stack.Navigator>
      <Stack.Screen name={ScreenName.MyWallet} component={MyLedgerSection} />
      <Stack.Screen name={NavigatorName.BaseOnboarding} component={BaseOnboardingTestScreens} />
    </Stack.Navigator>,
    {
      overrideInitialState: withFlagOverrides(
        { deviceOnboarding: { enabled: true, params: { unifiedEntryPoints } } },
        (state: State): State => ({
          ...state,
          ble: { ...state.ble, knownDevices: withDevice ? [knownDevice] : [] },
        }),
      ),
    },
  );
}

async function expectGetStartedFrom(source: string) {
  expect(await screen.findByTestId("onboarding-setupLedger")).toBeVisible();
  expect(screen.getByTestId("onboarding-accessWallet")).toBeVisible();
  expect(screen.queryByTestId("manager_setup_new_device")).toBeNull();
  expect(trackPage).toHaveBeenCalledWith(
    expect.objectContaining({ name: "Get Started", props: { source } }),
    expect.anything(),
  );
}

describe("MyLedgerSection add device", () => {
  afterEach(() => {
    jest.mocked(trackPage).mockClear();
    mockHidDevices.mockReturnValue([]);
  });

  it("should open the add device choice when unified entry points is off", async () => {
    const { user } = renderSection({ unifiedEntryPoints: false, withDevice: false });

    await user.press(screen.getByTestId("connect-with-bluetooth"));

    expect(await screen.findByTestId("manager_setup_new_device")).toBeVisible();
    expect(screen.queryByTestId("onboarding-setupLedger")).toBeNull();
  });

  it("should open Get Started from the empty device list", async () => {
    const { user } = renderSection({ unifiedEntryPoints: true, withDevice: false });

    await user.press(screen.getByTestId("connect-with-bluetooth"));

    await expectGetStartedFrom("my_wallet_empty");
  });

  it("should open Get Started when a device is already there", async () => {
    const { user } = renderSection({ unifiedEntryPoints: true, withDevice: true });

    await user.press(screen.getByText(/Add new|Add with Bluetooth/));

    await expectGetStartedFrom("my_wallet_add");
  });

  it("should open Get Started with my_wallet_add when only a USB device is plugged", async () => {
    mockHidDevices.mockReturnValue([
      {
        deviceId: "usb|stax",
        deviceName: "Ledger Stax",
        wired: true,
        modelId: DeviceModelId.stax,
        discoveredDevice: {},
      },
    ]);
    const { user } = renderSection({ unifiedEntryPoints: true, withDevice: false });

    await user.press(screen.getByText(/Add new|Add with Bluetooth/));

    await expectGetStartedFrom("my_wallet_add");
  });
});

const myLedgerDevice = {
  deviceId: "stax-id",
  deviceName: "Stax 4CE9",
  modelId: DeviceModelId.stax,
};

function MyLedgerSectionWithRoute() {
  const navigation = useNavigation<{ navigate: (name: string) => void }>();
  const { params } = useRoute<{
    key: string;
    name: string;
    params?: { device?: unknown; firmwareUpdate?: boolean };
  }>();
  return (
    <>
      <MyLedgerSection />
      <Text testID="device-param">{params?.device ? "set" : "consumed"}</Text>
      <Text testID="firmware-update-param">{params?.firmwareUpdate ? "set" : "consumed"}</Text>
      <Text onPress={() => navigation.navigate(NavigatorName.MyLedger)}>leave</Text>
    </>
  );
}

function MyLedgerDestination() {
  const navigation = useNavigation();
  const { params } = useRoute<{
    key: string;
    name: string;
    params?: { params?: { firmwareUpdate?: boolean } };
  }>();
  return (
    <>
      <Text testID="firmware-update">{String(params?.params?.firmwareUpdate)}</Text>
      <Text onPress={() => navigation.goBack()}>back</Text>
    </>
  );
}

function renderWithMyLedger() {
  return render(
    <Stack.Navigator>
      <Stack.Screen
        name={ScreenName.MyWallet}
        component={MyLedgerSectionWithRoute}
        initialParams={{ device: myLedgerDevice, firmwareUpdate: true }}
      />
      <Stack.Screen name={NavigatorName.MyLedger} component={MyLedgerDestination} />
    </Stack.Navigator>,
  );
}

describe("MyLedgerSection device param", () => {
  it("should connect the device of the route and hand the firmware update to My Ledger", async () => {
    const { user } = renderWithMyLedger();

    expect(await screen.findByTestId("connecting")).toHaveTextContent("stax-id");
    await user.press(screen.getByText("complete"));

    expect(await screen.findByTestId("firmware-update")).toHaveTextContent("true");
  });

  it("should neither connect the device again nor give a stale firmware update when coming back", async () => {
    const { user } = renderWithMyLedger();
    await user.press(await screen.findByText("complete"));

    await user.press(await screen.findByText("back"));

    expect(await screen.findByTestId("device-param")).toHaveTextContent("consumed");
    expect(screen.getByTestId("firmware-update-param")).toHaveTextContent("consumed");
    expect(screen.getByTestId("connecting")).toHaveTextContent("none");
  });

  it("should consume the device param when the connection is closed", async () => {
    const { user } = renderWithMyLedger();

    await user.press(await screen.findByText("close"));

    expect(await screen.findByTestId("device-param")).toHaveTextContent("consumed");
    expect(screen.getByTestId("firmware-update-param")).toHaveTextContent("consumed");
    expect(screen.getByTestId("connecting")).toHaveTextContent("none");
  });

  it("should resume the connection when My Wallet is left before it ends", async () => {
    const { user } = renderWithMyLedger();
    await user.press(await screen.findByText("leave"));

    await user.press(await screen.findByText("back"));

    expect(await screen.findByTestId("connecting")).toHaveTextContent("stax-id");
  });
});
