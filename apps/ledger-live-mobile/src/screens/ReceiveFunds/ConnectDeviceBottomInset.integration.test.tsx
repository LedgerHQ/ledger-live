import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import { render, screen } from "@tests/test-renderer";
import {
  BOTTOM_INSET,
  SELECT_DEVICE_TEST_ID,
  closePairingFlow,
  getBottomPaddingAbove,
  mockBottomInset,
  openPairingFlow,
} from "@tests/pairingFlowHost";
import type { ReceiveFundsStackParamList } from "~/components/RootNavigator/types/ReceiveFundsNavigator";
import { ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import ConnectDevice from "./03a-ConnectDevice";

const mockAccount = genAccount("receive-connect-device", {
  currency: getCryptoCurrencyById("bitcoin"),
});

jest.mock("LLM/hooks/useAccountScreen", () => ({
  useAccountScreen: () => ({ account: mockAccount, parentAccount: undefined }),
}));
jest.mock(
  "~/components/SelectDevice2",
  () => jest.requireActual("@tests/pairingFlowHost").selectDevice2Mock,
);
jest.mock("~/components/DeviceActionModal", () => ({ __esModule: true, default: () => null }));

const Stack = createNativeStackNavigator<ReceiveFundsStackParamList>();

async function renderConnectDevice() {
  render(
    <Stack.Navigator>
      <Stack.Screen
        name={ScreenName.ReceiveConnectDevice}
        component={ConnectDevice}
        initialParams={{ accountId: mockAccount.id }}
      />
    </Stack.Navigator>,
    {
      overrideInitialState: (state: State): State => ({
        ...state,
        settings: { ...state.settings, readOnlyModeEnabled: false },
      }),
    },
  );
  return getBottomPaddingAbove(await screen.findByTestId(SELECT_DEVICE_TEST_ID));
}

describe("Receive ConnectDevice bottom inset", () => {
  beforeEach(mockBottomInset);

  it("should add the bottom inset while the pairing flow is shown", async () => {
    const deviceListPadding = await renderConnectDevice();

    openPairingFlow();

    expect(getBottomPaddingAbove(screen.getByTestId(SELECT_DEVICE_TEST_ID))).toBe(
      deviceListPadding + BOTTOM_INSET,
    );
  });

  it("should remove the bottom inset when the pairing flow is closed", async () => {
    const deviceListPadding = await renderConnectDevice();

    openPairingFlow();
    closePairingFlow();

    expect(getBottomPaddingAbove(screen.getByTestId(SELECT_DEVICE_TEST_ID))).toBe(
      deviceListPadding,
    );
  });
});
