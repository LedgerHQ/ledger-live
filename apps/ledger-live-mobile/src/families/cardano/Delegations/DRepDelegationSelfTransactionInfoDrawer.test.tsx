import React from "react";
import { fireEvent, screen } from "@tests/test-renderer";
import { render } from "@tests/test-renderer";
import DRepDelegationSelfTransactionInfoDrawer from "./DRepDelegationSelfTransactionInfoDrawer";
import { CardanoAccount } from "@ledgerhq/live-common/families/cardano/types";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { NavigatorName, ScreenName } from "~/const";
import BigNumber from "bignumber.js";

jest.mock("@ledgerhq/live-dmk-mobile", () => ({}), { virtual: true });

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  getAccountBridge: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

jest.mock("~/components/wrappedUi/Button", () => {
  const { TouchableOpacity, Text } = jest.requireActual("react-native");
  return ({ onPress, children }: { onPress: () => void; children: React.ReactNode }) => (
    <TouchableOpacity onPress={onPress} testID="continue-button">
      <Text>{children}</Text>
    </TouchableOpacity>
  );
});
jest.mock("~/images/illustration/Illustration", () => "Illustration");

const mockAccount = {
  id: "test-account-id",
  freshAddress: "addr1test...",
  currency: { id: "cardano" },
} as unknown as CardanoAccount;

const mockBridge = {
  createTransaction: jest.fn(() => ({})),
  updateTransaction: jest.fn((tx, updates) => ({ ...tx, ...updates })),
};

describe("DRepDelegationSelfTransactionInfoDrawer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAccountBridge as jest.Mock).mockReturnValue(mockBridge);
  });

  it("renders when isOpen is true", () => {
    render(
      <DRepDelegationSelfTransactionInfoDrawer
        account={mockAccount}
        isOpen={true}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByText("DRep Delegation Self Transaction")).toBeTruthy();
    expect(screen.getByTestId("continue-button")).toBeTruthy();
  });

  it("renders without errors when isOpen is false", () => {
    expect(() =>
      render(
        <DRepDelegationSelfTransactionInfoDrawer
          account={mockAccount}
          isOpen={false}
          onClose={jest.fn()}
        />,
      ),
    ).not.toThrow();
  });

  it("creates transaction and navigates on continue", () => {
    render(
      <DRepDelegationSelfTransactionInfoDrawer
        account={mockAccount}
        isOpen={true}
        onClose={jest.fn()}
      />,
    );

    const continueButton = screen.getByTestId("continue-button");
    fireEvent.press(continueButton);

    expect(getAccountBridge).toHaveBeenCalledWith(mockAccount);
    expect(mockBridge.createTransaction).toHaveBeenCalledWith(mockAccount);
    expect(mockBridge.updateTransaction).toHaveBeenCalledWith(expect.anything(), {
      recipient: mockAccount.freshAddress,
      amount: new BigNumber(2000000),
    });

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.SendFunds, {
      screen: ScreenName.SendSelectRecipient,
      params: {
        accountId: mockAccount.id,
        transaction: expect.anything(),
      },
    });
  });
});
