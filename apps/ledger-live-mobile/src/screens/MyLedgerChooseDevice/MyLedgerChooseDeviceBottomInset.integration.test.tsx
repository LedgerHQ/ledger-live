import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { render } from "@tests/test-renderer";
import {
  BOTTOM_INSET,
  getDeviceListPaddingChangeAfterPairing,
  getPairingFlowBottomInset,
} from "@tests/pairingFlowHost";
import { ScreenName } from "~/const";
import MyLedgerChooseDeviceScreen from ".";

const Stack = createNativeStackNavigator();

const renderChooseDevice = () =>
  render(
    <Stack.Navigator>
      <Stack.Screen name={ScreenName.MyLedgerChooseDevice} component={MyLedgerChooseDeviceScreen} />
    </Stack.Navigator>,
  );

describe("MyLedgerChooseDevice bottom inset", () => {
  it("should add the bottom inset while the pairing flow is shown", async () => {
    expect(await getPairingFlowBottomInset(renderChooseDevice)).toBe(BOTTOM_INSET);
  });

  it("should give the device list its spacing back when the pairing flow is closed", async () => {
    expect(await getDeviceListPaddingChangeAfterPairing(renderChooseDevice)).toBe(0);
  });
});
