import React from "react";
import { screen, fireEvent } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import VoteDelegationDrawer from "./Drawer";
import BigNumber from "bignumber.js";
import { Text } from "react-native";

jest.mock("~/components/CurrencyIcon", () => {
  const { Text: RNText } = require("react-native");
  return () => <RNText>CurrencyIcon</RNText>;
});
const mockAccount = {
  id: "account-id",
  type: "Account",
  currency: { id: "cardano", units: [{ code: "ADA", name: "ADA", magnitude: 6 }] },
  balance: new BigNumber(1000),
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

const MockValidatorImage = () => <Text>Validator Image</Text>;
const MockIcon = () => <Text>Action Icon</Text>;

const mockOnClose = jest.fn();
const mockActionPress = jest.fn();

const mockData = [
  {
    label: "Test Label",
    Component: <Text>Test Component Value</Text>,
  },
];

const mockActions = [
  {
    label: "Test Action",
    Icon: MockIcon,
    onPress: mockActionPress,
  },
];

describe("VoteDelegationDrawer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not render when isOpen is false", () => {
    render(
      <VoteDelegationDrawer
        isOpen={false}
        onClose={mockOnClose}
        account={mockAccount}
        ValidatorImage={MockValidatorImage}
        formattedAmount={<Text>1000 ADA</Text>}
        formattedCounterValue={<Text>$500</Text>}
        data={mockData}
        actions={mockActions}
      />
    );
    // QueuedDrawer handles visibility, we assert contents are not rendered
    expect(screen.queryByText("Test Label")).toBeNull();
  });

  it("should render contents when isOpen is true", () => {
    render(
      <VoteDelegationDrawer
        isOpen={true}
        onClose={mockOnClose}
        account={mockAccount}
        ValidatorImage={MockValidatorImage}
        formattedAmount={<Text>1000 ADA</Text>}
        formattedCounterValue={<Text>$500</Text>}
        data={mockData}
        actions={mockActions}
      />
    );

    expect(screen.getByText("Test Label")).toBeDefined();
    expect(screen.getByText("Test Component Value")).toBeDefined();
    expect(screen.getByText("Test Action")).toBeDefined();
    expect(screen.getByText("Validator Image")).toBeDefined();
  });

  it("should call action onPress when action button is pressed", () => {
    render(
      <VoteDelegationDrawer
        isOpen={true}
        onClose={mockOnClose}
        account={mockAccount}
        ValidatorImage={MockValidatorImage}
        formattedAmount={<Text>1000 ADA</Text>}
        formattedCounterValue={<Text>$500</Text>}
        data={mockData}
        actions={mockActions}
      />
    );

    const actionBtn = screen.getByText("Test Action");
    fireEvent.press(actionBtn);
    expect(mockActionPress).toHaveBeenCalled();
  });
});
