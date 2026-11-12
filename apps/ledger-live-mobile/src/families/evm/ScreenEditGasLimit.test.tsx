import React from "react";
import BigNumber from "bignumber.js";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { fireEvent, render, screen } from "@tests/test-renderer";
import { DEFAULT_GAS_LIMIT } from "@ledgerhq/coin-evm/logic-public";
import type { Transaction } from "@ledgerhq/live-common/families/evm/types";
import type { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import { ScreenName } from "~/const";
import { component as EvmEditGasLimit } from "./ScreenEditGasLimit";

const Stack = createNativeStackNavigator<SendFundsNavigatorStackParamList>();

const transaction: Transaction = {
  family: "evm",
  mode: "send",
  amount: new BigNumber(0),
  recipient: "",
  gasLimit: new BigNumber(21000),
  nonce: 0,
  chainId: 1,
  type: 0,
  gasPrice: new BigNumber(1),
};

function renderScreen(setGasLimit: (gasLimit: BigNumber) => void) {
  return render(
    <Stack.Navigator>
      <Stack.Screen
        name={ScreenName.EvmEditGasLimit}
        component={EvmEditGasLimit}
        initialParams={{
          accountId: "evm-account",
          setGasLimit,
          gasLimit: new BigNumber(21000),
          transaction,
          currentNavigation: ScreenName.SendSummary,
          nextNavigation: ScreenName.SendSelectDevice,
        }}
      />
    </Stack.Navigator>,
  );
}

describe("EvmEditGasLimit", () => {
  it.each([
    ["50000", new BigNumber(50000)],
    ["0x5208", new BigNumber(21000)],
  ])("submits the typed gas limit %p", (text, expected) => {
    const setGasLimit = jest.fn();
    renderScreen(setGasLimit);

    const input = screen.getByDisplayValue("21000");
    fireEvent.changeText(input, text);
    fireEvent(input, "submitEditing");

    expect(setGasLimit).toHaveBeenCalledWith(expected);
  });

  it.each(["abc", "1.2.3", "-", "-5", "21000.5"])(
    "falls back to the default gas limit for %p",
    text => {
      const setGasLimit = jest.fn();
      renderScreen(setGasLimit);

      const input = screen.getByDisplayValue("21000");
      fireEvent.changeText(input, text);
      fireEvent(input, "submitEditing");

      expect(setGasLimit).toHaveBeenCalledWith(DEFAULT_GAS_LIMIT);
    },
  );
});
