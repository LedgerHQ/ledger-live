import React from "react";
import { screen, waitFor } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ScreenName } from "~/const";
import { State } from "~/reducers/types";
import { MockedAccounts } from "LLM/features/Accounts/__integrations__/mockedAccounts";

const mockTryTriggerPushNotificationDrawerAfterAction = jest.fn();

jest.mock("LLM/features/NotificationsPrompt/hooks/useNotifications", () => ({
  useNotifications: () => ({
    tryTriggerPushNotificationDrawerAfterAction: mockTryTriggerPushNotificationDrawerAfterAction,
  }),
}));

import SendValidationSuccess from "~/screens/SendFunds/07-ValidationSuccess";
import { PendingOperation as SwapPendingOperation } from "~/screens/Swap/SubScreens/PendingOperation";
import CosmosValidationSuccess from "~/families/cosmos/DelegationFlow/04-ValidationSuccess";

const Stack = createNativeStackNavigator();

const MOCK_ACCOUNT = MockedAccounts.active[0];

const INITIAL_STATE = {
  overrideInitialState: (state: State) => ({
    ...state,
    accounts: MockedAccounts,
    settings: {
      ...state.settings,
      readOnlyModeEnabled: false,
    },
  }),
};

describe("Push Notification Opt-In on Success Screens", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should trigger notification drawer with 'send' after SEND success", async () => {
    const sendParams = {
      accountId: MOCK_ACCOUNT.id,
      result: {
        id: "op-123",
        hash: "0x123abc",
        type: "OUT",
        accountId: MOCK_ACCOUNT.id,
      },
    };

    render(
      <Stack.Navigator>
        <Stack.Screen name={ScreenName.SendValidationSuccess}>
          {props => <SendValidationSuccess {...props} route={{ params: sendParams } as never} />}
        </Stack.Screen>
      </Stack.Navigator>,
      INITIAL_STATE,
    );

    await waitFor(() => {
      expect(screen.getByTestId("validate-success-screen")).toBeOnTheScreen();
    });

    expect(mockTryTriggerPushNotificationDrawerAfterAction).toHaveBeenCalledWith("send");
  });

  it("should trigger notification drawer with 'swap' after SWAP success", async () => {
    const swapParams = {
      swapOperation: {
        swapId: "swap-123",
        provider: "changelly",
        toCurrency: { id: "ethereum", name: "Ethereum" },
        fromCurrency: { id: "bitcoin", name: "Bitcoin" },
      },
    };

    render(
      <Stack.Navigator>
        <Stack.Screen name={ScreenName.SwapPendingOperation}>
          {props => <SwapPendingOperation {...props} route={{ params: swapParams } as never} />}
        </Stack.Screen>
      </Stack.Navigator>,
      INITIAL_STATE,
    );

    await waitFor(() => {
      expect(screen.getByTestId("swap-success-title")).toBeOnTheScreen();
    });

    expect(mockTryTriggerPushNotificationDrawerAfterAction).toHaveBeenCalledWith("swap");
  });

  it("should trigger notification drawer with 'stake' after STAKE success (Cosmos)", async () => {
    const stakeParams = {
      accountId: MOCK_ACCOUNT.id,
      result: {
        id: "op-stake-123",
        hash: "0xstake123",
        type: "DELEGATE",
        accountId: MOCK_ACCOUNT.id,
      },
      transaction: { family: "cosmos", mode: "delegate" },
      validatorName: "Test Validator",
      source: { name: "stake" },
    };

    render(
      <Stack.Navigator>
        <Stack.Screen name={ScreenName.CosmosDelegationValidationSuccess}>
          {props => <CosmosValidationSuccess {...props} route={{ params: stakeParams } as never} />}
        </Stack.Screen>
      </Stack.Navigator>,
      INITIAL_STATE,
    );

    await waitFor(() => {
      expect(screen.getByTestId("validate-success-screen")).toBeOnTheScreen();
    });

    expect(mockTryTriggerPushNotificationDrawerAfterAction).toHaveBeenCalledWith("stake");
  });
});
