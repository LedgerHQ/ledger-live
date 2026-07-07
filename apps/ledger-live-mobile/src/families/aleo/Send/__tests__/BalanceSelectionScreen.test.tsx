import React from "react";
import { View, Text } from "react-native";
import { screen, render } from "@tests/test-renderer";
import { BalanceSelectionScreen } from "../BalanceSelectionScreen";
import { ScreenName } from "~/const";
import { ALEO_ACCOUNT_1 } from "../../__mocks__/account.mock";

const mockTransaction = { family: "aleo" };
const mockCreateTransaction = jest.fn(() => mockTransaction);

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: jest.fn(() => ({
    createTransaction: mockCreateTransaction,
  })),
}));

jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const actual = jest.requireActual("@ledgerhq/lumen-ui-rnative");

  return {
    ...actual,
    Box: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    Text: ({ children }: { children: React.ReactNode }) => <Text>{children}</Text>,
  };
});

jest.mock("~/components/StepHeader", () => {
  return function MockStepHeader({ title }: { title: string }) {
    return <Text testID="step-header">{title}</Text>;
  };
});

function makeNavigation() {
  return { navigate: jest.fn() };
}

function makeRoute() {
  return {
    key: "aleo-balance-selection",
    name: "AleoSendBalanceSelection" as const,
    params: { account: ALEO_ACCOUNT_1, parentAccount: undefined, isSelfTransfer: false },
  };
}

describe("BalanceSelectionScreen", () => {
  const mockNavigation = makeNavigation();
  const mockRoute = makeRoute();

  it("navigates to SendSelectRecipient with the created transaction", async () => {
    const { user } = render(
      <BalanceSelectionScreen navigation={mockNavigation as never} route={mockRoute as never} />,
    );

    await user.press(screen.getByText("Public"));

    expect(mockNavigation.navigate).toHaveBeenCalledTimes(1);
    expect(mockNavigation.navigate).toHaveBeenCalledWith(
      ScreenName.SendSelectRecipient,
      expect.objectContaining({
        accountId: ALEO_ACCOUNT_1.id,
        transaction: mockTransaction,
      }),
    );
  });
});
