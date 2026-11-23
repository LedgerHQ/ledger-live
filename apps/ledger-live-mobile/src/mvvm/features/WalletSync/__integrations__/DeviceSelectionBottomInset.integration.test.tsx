import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { render } from "@tests/test-renderer";
import {
  BOTTOM_INSET,
  getDeviceListPaddingChangeAfterPairing,
  getPairingFlowBottomInset,
} from "@tests/pairingFlowHost";
import DeviceSelection from "../screens/DeviceSelection";

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

const renderDeviceSelection = () =>
  render(
    <Stack.Navigator>
      <Stack.Screen name="WalletSyncDeviceSelection" component={DeviceSelectionScreen} />
    </Stack.Navigator>,
  );

describe("WalletSync DeviceSelection bottom inset", () => {
  it("should add the bottom inset while the pairing flow is shown", async () => {
    expect(await getPairingFlowBottomInset(renderDeviceSelection)).toBe(BOTTOM_INSET);
  });

  it("should give the device list its spacing back when the pairing flow is closed", async () => {
    expect(await getDeviceListPaddingChangeAfterPairing(renderDeviceSelection)).toBe(0);
  });
});
