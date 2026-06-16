import React, { useEffect } from "react";
import { render, screen } from "@tests/test-renderer";
import {
  createNativeStackNavigator,
  type NativeStackNavigationProp,
} from "@react-navigation/native-stack";
import type { NavigatorScreenParams } from "@react-navigation/native";
import { component as UnstakeFlow } from "../index";
import { NavigatorName, ScreenName } from "~/const";
import { makeMockTezosAccount } from "../../__tests__/testUtils";
import type { TezosUnstakeFlowParamList } from "../types";

jest.mock("@ledgerhq/live-dmk-mobile", () => ({}), { virtual: true });

const mockAccount = makeMockTezosAccount("tezos-unstake-integ");

jest.mock("LLM/hooks/useAccountScreen", () => ({
  useAccountScreen: () => ({ account: mockAccount, parentAccount: null }),
}));
jest.mock("LLM/hooks/useAccountUnit", () => ({
  useAccountUnit: () => require("../../__tests__/testUtils").tezosUnit,
}));
jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => {
  const bridge = require("../../__tests__/testUtils").makeMockAccountBridge({ mode: "unstake" });
  return { useAccountBridge: () => bridge };
});
jest.mock("@ledgerhq/live-common/bridge/useBridgeTransaction", () => {
  const result = require("../../__tests__/testUtils").makeMockBridgeTransactionResult("unstake");
  return { __esModule: true, default: () => result };
});
jest.mock("@ledgerhq/live-common/families/tezos/react", () => {
  const BN = require("bignumber.js");
  return {
    useTezosStakingInfo: () => ({ stakedBalance: new BN(5_000_000) }),
  };
});

// Keep the amount form light: its heavy leaf widgets (counter-values, modal) are covered by the
// Amount unit test. The flow still renders the real Amount screen, CTA and ValidationSuccess.
jest.mock(
  "~/screens/SendFunds/AmountInput",
  () => require("../../__tests__/testUtils").MockAmountInput,
);
jest.mock("~/components/Alert", () => () => null);
jest.mock("~/components/CurrencyUnitValue", () => () => null);
jest.mock("~/components/GenericErrorBottomModal", () => () => null);
jest.mock("~/components/KeyboardView", () => require("../../__tests__/testUtils").MockKeyboardView);
jest.mock("~/components/PreventNativeBack", () => () => null);
jest.mock("~/components/Button", () => ({
  __esModule: true,
  default: require("../../__tests__/testUtils").MockButton,
}));

jest.mock("~/screens/SelectDevice", () => ({
  __esModule: true,
  default: require("../../__tests__/testUtils").MockSelectDevice,
}));
jest.mock("~/screens/ConnectDevice", () => ({
  __esModule: true,
  default: require("../../__tests__/testUtils").makeMockConnectDevice({
    result: { id: "op-unstake-1", type: "UNSTAKE" },
    errorMessage: "Unstake broadcast failed",
  }),
}));
jest.mock("~/components/ValidateError", () => ({
  __esModule: true,
  default: require("../../__tests__/testUtils").MockValidateError,
}));

type RootStackParamList = {
  Entry: undefined;
  [NavigatorName.TezosUnstakeFlow]: NavigatorScreenParams<TezosUnstakeFlowParamList>;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();

const EntryScreen = ({
  navigation,
}: {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}) => {
  useEffect(() => {
    navigation.navigate(NavigatorName.TezosUnstakeFlow, {
      screen: ScreenName.TezosUnstakeAmount,
      params: { accountId: mockAccount.id },
    });
  }, [navigation]);
  return null;
};

const TestNavigator = () => (
  <RootStack.Navigator initialRouteName="Entry">
    <RootStack.Screen name="Entry" component={EntryScreen} />
    <RootStack.Screen
      name={NavigatorName.TezosUnstakeFlow}
      component={UnstakeFlow}
      options={{ headerShown: false }}
    />
  </RootStack.Navigator>
);

describe("Tezos unstake flow (integration)", () => {
  it("walks Amount → select device → connect device → ValidationSuccess", async () => {
    const { user } = render(<TestNavigator />);

    // Real Amount screen: CTA renders the unstaking copy.
    expect(await screen.findByText("Unstake")).toBeVisible();

    await user.press(await screen.findByTestId("tezos-unstake-amount-continue"));
    await user.press(await screen.findByTestId("mock-select-device"));
    await user.press(await screen.findByTestId("mock-connect-broadcast"));

    // Real ValidationSuccess screen with the success copy.
    expect(await screen.findByText("Unstake submitted")).toBeVisible();
  });

  it("reaches ValidationError when the broadcast fails", async () => {
    const { user } = render(<TestNavigator />);

    await user.press(await screen.findByTestId("tezos-unstake-amount-continue"));
    await user.press(await screen.findByTestId("mock-select-device"));
    await user.press(await screen.findByTestId("mock-connect-error"));

    expect(await screen.findByTestId("validate-error")).toBeVisible();
    expect(screen.getByText("Unstake broadcast failed")).toBeVisible();
  });
});
