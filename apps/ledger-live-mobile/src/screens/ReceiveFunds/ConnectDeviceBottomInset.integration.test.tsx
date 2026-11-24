import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import { render } from "@tests/test-renderer";
import {
  BOTTOM_INSET,
  getDeviceListPaddingChangeAfterPairing,
  getPairingFlowBottomInset,
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

const Stack = createNativeStackNavigator<ReceiveFundsStackParamList>();

const renderConnectDevice = () =>
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

describe("Receive ConnectDevice bottom inset", () => {
  it("should add the bottom inset while the pairing flow is shown", async () => {
    expect(await getPairingFlowBottomInset(renderConnectDevice)).toBe(BOTTOM_INSET);
  });

  it("should give the device list its spacing back when the pairing flow is closed", async () => {
    expect(await getDeviceListPaddingChangeAfterPairing(renderConnectDevice)).toBe(0);
  });
});
