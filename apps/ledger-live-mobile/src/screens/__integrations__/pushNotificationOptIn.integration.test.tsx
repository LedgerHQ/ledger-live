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
