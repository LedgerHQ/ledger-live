import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { ReactTestInstance } from "react-test-renderer";
import { render, screen } from "@tests/test-renderer";
import { SELECT_DEVICE_TEST_ID, closePairingFlow, openPairingFlow } from "@tests/pairingFlowHost";
import DeviceSelection from "../screens/DeviceSelection";

jest.mock("~/hooks/deviceActions", () => ({
  useAppDeviceAction: () => jest.fn(),
  useSelectDevice: () => ({
    device: null,
    selectDevice: jest.fn(),
    registerDeviceSelection: jest.fn(),
  }),
}));
jest.mock(
  "~/components/SelectDevice2",
  () => jest.requireActual("@tests/pairingFlowHost").selectDevice2Mock,
);
jest.mock("~/components/DeviceActionModal", () => ({ __esModule: true, default: () => null }));

const Stack = createNativeStackNavigator();

function DeviceSelectionScreen() {
  return (
    <DeviceSelection
      goToFollowInstructions={jest.fn()}
      route={{ params: {} } as never}
      navigation={{} as never}
    />
  );
}

function getSafeAreaBottomEdge(element: ReactTestInstance): string | undefined {
  let node: ReactTestInstance | null = element;
  while (node) {
    if (node.props.edges?.bottom) return node.props.edges.bottom;
    node = node.parent;
  }
  return undefined;
}

async function renderDeviceSelection() {
  render(
    <Stack.Navigator>
      <Stack.Screen name="WalletSyncDeviceSelection" component={DeviceSelectionScreen} />
    </Stack.Navigator>,
  );
  return getSafeAreaBottomEdge(await screen.findByTestId(SELECT_DEVICE_TEST_ID));
}

describe("WalletSync DeviceSelection bottom inset", () => {
  it("should leave the bottom inset to the device list", async () => {
    expect(await renderDeviceSelection()).toBe("off");
  });

  it("should add the bottom inset while the pairing flow is shown", async () => {
    await renderDeviceSelection();

    openPairingFlow();

    expect(getSafeAreaBottomEdge(screen.getByTestId(SELECT_DEVICE_TEST_ID))).toBe("additive");
  });

  it("should remove the bottom inset when the pairing flow is closed", async () => {
    await renderDeviceSelection();

    openPairingFlow();
    closePairingFlow();

    expect(getSafeAreaBottomEdge(screen.getByTestId(SELECT_DEVICE_TEST_ID))).toBe("off");
  });
});
