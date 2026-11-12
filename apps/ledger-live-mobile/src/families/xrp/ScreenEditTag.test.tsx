import React from "react";
import BigNumber from "bignumber.js";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { fireEvent, render, screen } from "@tests/test-renderer";
import type { Transaction } from "@ledgerhq/live-common/families/xrp/types";
import type { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import { ScreenName } from "~/const";
import { popToScreen } from "~/helpers/navigationHelpers";
import { component as XrpEditTag } from "./ScreenEditTag";

jest.mock("LLM/hooks/useAccountScreen", () => ({
  useAccountScreen: () => ({ account: { id: "xrp-account" }, parentAccount: null }),
}));

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({
    updateTransaction: (tx: Transaction, patch: Partial<Transaction>): Transaction => ({
      ...tx,
      ...patch,
    }),
  }),
}));

jest.mock("~/helpers/navigationHelpers", () => ({ popToScreen: jest.fn() }));

const Stack = createNativeStackNavigator<SendFundsNavigatorStackParamList>();

const transaction: Transaction = {
  family: "xrp",
  amount: new BigNumber(0),
  recipient: "",
  useAllAmount: false,
  fees: null,
  networkInfo: null,
  tag: 42,
};

const submitTag = (text: string) => {
  render(
    <Stack.Navigator>
      <Stack.Screen
        name={ScreenName.XrpEditTag}
        component={XrpEditTag}
        initialParams={{ accountId: "xrp-account", transaction }}
      />
    </Stack.Navigator>,
  );
  const input = screen.getByDisplayValue("42");
  fireEvent.changeText(input, text);
  fireEvent(input, "submitEditing");
};

describe("XrpEditTag", () => {
  beforeEach(() => jest.mocked(popToScreen).mockClear());

  it.each([
    ["123", 123],
    ["", undefined],
    ["abc", undefined],
    ["99999999999", undefined],
  ])("maps the typed tag %p to %p without throwing", (text, expected) => {
    submitTag(text);
    expect(popToScreen).toHaveBeenCalledWith(
      expect.anything(),
      ScreenName.SendSummary,
      expect.objectContaining({ transaction: expect.objectContaining({ tag: expected }) }),
    );
  });
});
