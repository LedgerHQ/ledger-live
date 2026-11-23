import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { render, screen } from "@tests/test-renderer";
import {
  BOTTOM_INSET,
  SELECT_DEVICE_TEST_ID,
  closePairingFlow,
  getBottomPaddingAbove,
  mockBottomInset,
  openPairingFlow,
} from "@tests/pairingFlowHost";
import { ScreenName } from "~/const";
import MyLedgerChooseDeviceScreen from ".";

jest.mock(
  "~/components/SelectDevice2",
  () => jest.requireActual("@tests/pairingFlowHost").selectDevice2Mock,
);
jest.mock("~/components/DeviceActionModal", () => ({ __esModule: true, default: () => null }));

const Stack = createNativeStackNavigator();

async function renderChooseDevice() {
  render(
    <Stack.Navigator>
      <Stack.Screen name={ScreenName.MyLedgerChooseDevice} component={MyLedgerChooseDeviceScreen} />
    </Stack.Navigator>,
  );
  return getBottomPaddingAbove(await screen.findByTestId(SELECT_DEVICE_TEST_ID));
}

describe("MyLedgerChooseDevice bottom inset", () => {
  beforeEach(mockBottomInset);

  it("should add the bottom inset while the pairing flow is shown", async () => {
    const deviceListPadding = await renderChooseDevice();

    openPairingFlow();

    expect(getBottomPaddingAbove(screen.getByTestId(SELECT_DEVICE_TEST_ID))).toBe(
      deviceListPadding + BOTTOM_INSET,
    );
  });

  it("should remove the bottom inset when the pairing flow is closed", async () => {
    const deviceListPadding = await renderChooseDevice();

    openPairingFlow();
    closePairingFlow();

    expect(getBottomPaddingAbove(screen.getByTestId(SELECT_DEVICE_TEST_ID))).toBe(
      deviceListPadding,
    );
  });
});
